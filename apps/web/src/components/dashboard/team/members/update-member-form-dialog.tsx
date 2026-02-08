'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  TeamMemberUpdateInput,
  TeamMemberUpdateInputSchema,
} from '@fuku/api/schemas'
import {
  AlertDialog,
  AlertDialogTrigger,
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  DialogClose,
  DialogTitle,
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
  FieldSet,
  Input,
  LoadingButton,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@fuku/ui/components'
import { cn } from '@fuku/ui/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, ChevronDown } from 'lucide-react'
import {
  Controller,
  SubmitErrorHandler,
  SubmitHandler,
  useForm,
} from 'react-hook-form'
import { toast } from 'sonner'

import { useDialogStore } from '~/store/dialog'
import { useTRPC } from '~/trpc/client'
import { DiscardChangesAlertDialogContent } from '../../discard-changes-alert-dialog'

export const UpdateMemberFormDialog = () => {
  const { editingId: currentTeamMemberId, closeDialog } = useDialogStore()
  const [payGradeOpen, setPayGradeOpen] = useState(false)

  const queryClient = useQueryClient()
  const trpc = useTRPC()
  const params = useParams()
  const slug = params?.slug as string
  const { data: team } = useQuery({
    ...trpc.team.bySlug.queryOptions({ slug: slug! }),
    enabled: !!slug,
  })

  const {
    data: teamMember,
    isPending,
    isSuccess: teamMemberFetched,
  } = useQuery({
    ...trpc.teamMember.byId.queryOptions({ id: currentTeamMemberId! }),
    enabled: !!currentTeamMemberId,
  })

  const { data: payGrades } = useQuery({
    ...trpc.payGrade.listDetailed.queryOptions({ teamId: team!.id }),
    enabled: !!team,
  })

  const form = useForm<TeamMemberUpdateInput>({
    defaultValues: {
      id: currentTeamMemberId || '',
      givenNames: '',
      familyName: '',
      payGradeId: '',
      rateMultiplier: 1,
      username: '',
    },
    resolver: zodResolver(TeamMemberUpdateInputSchema),
  })

  useEffect(() => {
    if (teamMemberFetched && teamMember && currentTeamMemberId) {
      form.reset(
        {
          ...teamMember,
          id: currentTeamMemberId,
          userId: teamMember.user?.id || null,
          user: teamMember.user || null,
          payGrade: teamMember.payGrade || null,
          username: teamMember.user?.username || '',
        },
        {
          keepDirty: false,
          keepTouched: false,
          keepErrors: false,
        },
      )
    }
  }, [teamMemberFetched, teamMember, currentTeamMemberId])

  const { mutateAsync: updateMember } = useMutation({
    ...trpc.teamMember.update.mutationOptions(),
    onError: error => {
      toast.error('Error', {
        description: `${error.data?.httpStatus && ` (${error.data.httpStatus})`}: ${error.message}`,
      })
    },
    onSuccess: data => {
      queryClient.setQueryData(
        trpc.teamMember.byId.queryKey({ id: data.id }),
        data,
      )
      closeDialog()
      toast.success('Team member', {
        description: `${data.givenNames} ${data.familyName} has been updated.`,
      })
    },
  })

  const onSubmit: SubmitHandler<TeamMemberUpdateInput> = async data => {
    if (!form.formState.isDirty) {
      form.setError('root', { message: 'There are no changes to save.' })
      return
    }
    try {
      await updateMember(data)
    } catch {
      // Handled in onError
    }
  }

  const onError: SubmitErrorHandler<TeamMemberUpdateInput> = errors => {
    console.error('update member errors:', errors)
    console.error('update member values:', form.getValues())
  }

  const cancelButton = (
    <Button variant='outline' className='ml-auto'>
      Cancel
    </Button>
  )

  return (
    <>
      <DialogTitle>Edit Team Member</DialogTitle>
      <form
        id='form-update-member'
        onSubmit={form.handleSubmit(onSubmit, onError)}
      >
        <FieldSet
          disabled={
            form.formState.isSubmitting || !teamMemberFetched || !teamMember
          }
        >
          <FieldGroup>
            <Controller
              name='givenNames'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='form-update-member-given-names'>
                    Given Name(s)
                  </FieldLabel>
                  <Input
                    {...field}
                    id='form-update-member-given-names'
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
                  <FieldLabel htmlFor='form-update-member-family-name'>
                    Last Name
                  </FieldLabel>
                  <Input
                    {...field}
                    id='form-update-member-family-name'
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
                    <FieldLabel htmlFor='form-update-member-pay-grade-id'>
                      Pay Grade
                    </FieldLabel>
                    <Popover open={payGradeOpen} onOpenChange={setPayGradeOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          id='form-update-member-pay-grade-id'
                          variant='outline'
                          role='combobox'
                          className='justify-between'
                        >
                          {field.value && payGrades
                            ? payGrades.find(pg => pg.id === field.value)?.name
                            : 'Select pay grade...'}
                          <ChevronDown className='opacity-50' />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className='p-0' align='start'>
                        <Command>
                          <CommandList>
                            <CommandEmpty>No pay grade found.</CommandEmpty>
                            <CommandGroup>
                              {payGrades?.map(pg => (
                                <CommandItem
                                  key={pg.id}
                                  value={pg.id}
                                  onSelect={currentValue => {
                                    form.setValue('payGradeId', currentValue, {
                                      shouldValidate: true,
                                      shouldTouch: true,
                                      shouldDirty: true,
                                    })
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
                <FieldLabel htmlFor='form-update-member-base-rate'>
                  Base Rate
                </FieldLabel>
                <Button
                  id='form-update-member-base-rate'
                  variant='outline'
                  disabled
                  className='text-justify items-start justify-start disabled:opacity-100'
                >
                  {payGrades && form.getValues('payGradeId') ? (
                    payGrades.find(pg => pg.id === form.getValues('payGradeId'))
                      ?.baseRate
                  ) : (
                    <span className='text-muted-foreground'>N/A</span>
                  )}
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
                    <FieldLabel htmlFor='form-update-member-rate-multiplier'>
                      Multiplier
                    </FieldLabel>
                    <Input
                      {...field}
                      id='form-update-member-rate-multiplier'
                      type='number'
                      step='0.01'
                      min='0'
                      aria-invalid={fieldState.invalid}
                      placeholder='Rate Multiplier'
                      autoComplete='off'
                      onChange={e =>
                        field.onChange(
                          e.target.value === '' ? 0 : Number(e.target.value),
                        )
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
                  <FieldLabel htmlFor='form-update-member-username'>
                    Linked Account
                  </FieldLabel>
                  <Input
                    {...field}
                    id='form-update-member-username'
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
              <AlertDialog>
                {form.formState.isDirty ? (
                  <>
                    <AlertDialogTrigger asChild>
                      {cancelButton}
                    </AlertDialogTrigger>
                    <DiscardChangesAlertDialogContent />
                  </>
                ) : (
                  <DialogClose asChild>{cancelButton}</DialogClose>
                )}
              </AlertDialog>
              <LoadingButton
                loading={isPending}
                disabled={!teamMember || !payGrades}
              >
                Save
              </LoadingButton>
            </Field>
          </FieldGroup>
        </FieldSet>
      </form>
    </>
  )
}
