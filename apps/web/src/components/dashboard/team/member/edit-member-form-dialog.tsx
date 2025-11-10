import { useEffect } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
  FieldSet,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Spinner,
} from '@fuku/ui/components'
import { cn } from '@fuku/ui/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, ChevronDown } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import z from 'zod/v4'

import { TeamMemberSchema } from '~/lib/member'
import { useDashboardStore } from '~/store/dashboard'
import { useTeamMemberStore } from '~/store/member'
import { useTRPC } from '~/trpc/client'

const TeamMemberEditFormSchema = TeamMemberSchema.extend({
  username: z.string().optional(),
})
type TeamMemberEditFormType = z.infer<typeof TeamMemberEditFormSchema>

interface EditMemberFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const EditMemberFormDialog = ({
  open,
  onOpenChange,
}: EditMemberFormDialogProps) => {
  const queryClient = useQueryClient()

  const { currentTeamSlug } = useDashboardStore()
  const { currentTeamMemberId, payGradeOpen, setPayGradeOpen } =
    useTeamMemberStore()
  const trpc = useTRPC()
  const { data: teamMember, isSuccess: teamMemberFetched } = useQuery({
    ...trpc.teamMember.getById.queryOptions({
      id: currentTeamMemberId!,
    }),
    enabled: !!currentTeamMemberId,
  })

  const { data: payGrades } = useQuery({
    ...trpc.payGrade.getAllByTeamSlug.queryOptions({
      teamSlug: currentTeamSlug!,
    }),
    enabled: !!currentTeamSlug,
  })

  const form = useForm<TeamMemberEditFormType>({
    defaultValues: {
      ...teamMember,
      username: teamMember?.user?.username || '',
    },
    resolver: zodResolver(TeamMemberEditFormSchema),
  })

  useEffect(() => {
    if (teamMemberFetched && teamMember) {
      form.reset({ ...teamMember, username: teamMember.user?.username || '' })
    }
  }, [teamMemberFetched, teamMember])

  const { mutateAsync: editMember } = useMutation({
    ...trpc.teamMember.update.mutationOptions(),
    onError: error => {
      toast.error(
        `ERROR${error.data?.httpStatus && ` (${error.data.httpStatus})`}: ${error.message}`,
      )
    },
    onSuccess: data => {
      onOpenChange(false)
      queryClient.invalidateQueries({
        queryKey: trpc.team.getTeamMembersBySlug.queryKey(),
      })
      toast.success(
        `${data.givenNames} ${data.familyName} updated successfully.`,
      )
    },
  })

  const onSubmit = async (data: TeamMemberEditFormType) => {
    if (!form.formState.isDirty) {
      form.setError('root', { message: 'There are no changes to save.' })
      return
    }
    try {
      await editMember(data)
    } catch {
      // Handled in onError
    }
  }

  const onError = (errors: any) => {
    console.error('Form submission errors:', errors)
  }

  const cancelButton = (
    <Button variant='outline' className='ml-auto'>
      Cancel
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <AlertDialog>
        {!teamMember || !payGrades ? (
          <Spinner />
        ) : (
          <>
            <DialogContent>
              <DialogTitle>Edit Team Member</DialogTitle>
              <form
                id='form-edit-member'
                onSubmit={form.handleSubmit(onSubmit, onError)}
              >
                <FieldSet
                  disabled={
                    form.formState.isSubmitting ||
                    !teamMemberFetched ||
                    !teamMember
                  }
                >
                  <FieldGroup>
                    <Controller
                      name='givenNames'
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor='form-edit-member-given-names'>
                            Given Name(s)
                          </FieldLabel>
                          <Input
                            {...field}
                            id='form-edit-member-given-names'
                            aria-invalid={fieldState.invalid}
                            placeholder='Given Name(s)'
                            autoComplete='off'
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                    <Controller
                      name='familyName'
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor='form-edit-member-family-name'>
                            Last Name
                          </FieldLabel>
                          <Input
                            {...field}
                            id='form-edit-member-family-name'
                            aria-invalid={fieldState.invalid}
                            placeholder='Last Name'
                            autoComplete='off'
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />

                    <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
                      <Controller
                        name='payGradeId'
                        control={form.control}
                        render={({ field, fieldState }) => (
                          <Field
                            data-invalid={fieldState.invalid}
                            className='col-span-2 sm:col-span-2'
                          >
                            <FieldLabel htmlFor='form-edit-member-pay-grade-id'>
                              Pay Grade
                            </FieldLabel>
                            <Popover
                              open={payGradeOpen}
                              onOpenChange={setPayGradeOpen}
                            >
                              <PopoverTrigger asChild>
                                <Button
                                  id='form-edit-member-pay-grade-id'
                                  variant='outline'
                                  role='combobox'
                                  className='justify-between'
                                >
                                  {field.value && payGrades
                                    ? payGrades.find(
                                        pg => pg.id === field.value,
                                      )?.name
                                    : 'Select pay grade...'}
                                  <ChevronDown className='opacity-50' />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className='p-0' align='start'>
                                <Command>
                                  <CommandList>
                                    <CommandEmpty>
                                      No pay grade found.
                                    </CommandEmpty>
                                    <CommandGroup>
                                      {payGrades?.map(pg => (
                                        <CommandItem
                                          key={pg.id}
                                          value={pg.id}
                                          onSelect={currentValue => {
                                            form.setValue(
                                              'payGradeId',
                                              currentValue,
                                              {
                                                shouldValidate: true,
                                                shouldTouch: true,
                                                shouldDirty: true,
                                              },
                                            )
                                            form.setValue('payGrade', pg, {
                                              shouldValidate: true,
                                              shouldTouch: true,
                                              shouldDirty: true,
                                            })
                                            setPayGradeOpen(false)
                                          }}
                                        >
                                          {pg.name}
                                          <Check
                                            className={cn(
                                              'ml-auto',
                                              pg.id === field.value
                                                ? 'opacity-100'
                                                : 'opacity-0',
                                            )}
                                          />
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                            {fieldState.invalid && (
                              <FieldError errors={[fieldState.error]} />
                            )}
                          </Field>
                        )}
                      />
                      <Field className='col-span-1'>
                        <FieldLabel htmlFor='form-edit-member-base-rate'>
                          Base Rate
                        </FieldLabel>
                        <Button
                          id='form-edit-member-base-rate'
                          variant='outline'
                          disabled
                          className='text-justify items-start justify-start disabled:opacity-100'
                        >
                          {payGrades && form.getValues('payGradeId')
                            ? payGrades.find(
                                pg => pg.id === form.getValues('payGradeId'),
                              )?.baseRate
                            : 'N/A'}
                        </Button>
                      </Field>
                      <Controller
                        name='rateMultiplier'
                        control={form.control}
                        render={({ field, fieldState }) => (
                          <Field
                            data-invalid={fieldState.invalid}
                            className='col-span-1'
                          >
                            <FieldLabel htmlFor='form-edit-member-rate-multiplier'>
                              Multiplier
                            </FieldLabel>
                            <Input
                              {...field}
                              id='form-edit-member-rate-multiplier'
                              type='number'
                              step='0.01'
                              min='0'
                              aria-invalid={fieldState.invalid}
                              placeholder='Rate Multiplier'
                              autoComplete='off'
                              onChange={e =>
                                field.onChange(parseFloat(e.target.value))
                              }
                            />
                            {fieldState.invalid && (
                              <FieldError errors={[fieldState.error]} />
                            )}
                          </Field>
                        )}
                      />
                    </div>
                    <FieldSeparator />
                    <Controller
                      name='username'
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field>
                          <FieldLabel htmlFor='form-edit-member-username'>
                            Linked Account
                          </FieldLabel>
                          <Input
                            {...field}
                            id='form-edit-member-username'
                            aria-invalid={fieldState.invalid}
                            placeholder='Username (optional)'
                          />
                          <FieldDescription>
                            Link this member to an existing user account.
                          </FieldDescription>
                        </Field>
                      )}
                    />

                    <Field orientation='responsive'>
                      <FieldError errors={[form.formState.errors.root]} />
                      {form.formState.isDirty ? (
                        <AlertDialogTrigger asChild>
                          {cancelButton}
                        </AlertDialogTrigger>
                      ) : (
                        <DialogClose asChild>{cancelButton}</DialogClose>
                      )}
                      <Button type='submit' form='form-edit-member'>
                        Confirm
                      </Button>
                    </Field>
                  </FieldGroup>
                </FieldSet>
              </form>
            </DialogContent>
            <AlertDialogContent>
              <AlertDialogTitle>Discard changes?</AlertDialogTitle>
              <AlertDialogDescription>
                You have unsaved changes. If you discard them, your edits will
                be lost.
              </AlertDialogDescription>
              <AlertDialogFooter>
                <AlertDialogCancel asChild>
                  <Button variant='outline'>Keep editing</Button>
                </AlertDialogCancel>
                <AlertDialogAction asChild>
                  <DialogClose asChild>
                    <Button
                      variant='destructive'
                      className='bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60'
                    >
                      Discard
                    </Button>
                  </DialogClose>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </>
        )}
      </AlertDialog>
    </Dialog>
  )
}
