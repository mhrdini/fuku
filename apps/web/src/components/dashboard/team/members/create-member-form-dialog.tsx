'use client'

import { useEffect, useState } from 'react'
import { TeamMemberRole } from '@fuku/db'
import { TeamMemberInputSchema } from '@fuku/db/schemas'
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

import { DialogId } from '~/lib/dialog'
import { useDashboardStore } from '~/store/dashboard'
import { useDialogStore } from '~/store/dialog'
import { useTRPC } from '~/trpc/client'
import { DiscardChangesAlertDialogContent } from '../../discard-changes-alert-dialog'

const TeamMemberCreateFormSchema = TeamMemberInputSchema.extend({
  givenNames: z.string().min(1, { error: 'invalid_given_names' }),
  familyName: z.string().min(1, { error: 'invalid_family_name' }),
  payGradeId: z.string({ error: 'invalid_pay_grade_id' }),
  rateMultiplier: z
    .number({ error: 'invalid_rate_multiplier' })
    .min(0, { error: 'invalid_rate_multiplier_negative' }),
  username: z.string().optional(),
}).omit({
  unavailabilities: true,
  dayAssignments: true,
})

type TeamMemberCreateFormType = z.infer<typeof TeamMemberCreateFormSchema>

export const CreateMemberFormDialog = () => {
  const { currentTeamId } = useDashboardStore()

  const { id, closeDialog } = useDialogStore()
  const [payGradeOpen, setPayGradeOpen] = useState(false)

  const queryClient = useQueryClient()
  const trpc = useTRPC()

  const { data: payGrades } = useQuery({
    ...trpc.payGrade.list.queryOptions({}),
  })

  const { mutateAsync: createMember, isPending } = useMutation({
    ...trpc.teamMember.create.mutationOptions(),
    onError: error => {
      toast.error(
        `ERROR${error.data?.httpStatus && ` (${error.data.httpStatus})`}: ${error.message}`,
      )
    },
    onSuccess: data => {
      closeDialog()
      queryClient.invalidateQueries({
        ...trpc.location.list.queryOptions({}),
      })
      toast.success(
        `${data.givenNames} ${data.familyName} has been created to the team.`,
      )
    },
  })

  const form = useForm<TeamMemberCreateFormType>({
    defaultValues: {
      givenNames: '',
      familyName: '',
      teamId: '',
      rateMultiplier: 1,
      teamMemberRole: TeamMemberRole.STAFF,
      username: '',
    },
    resolver: zodResolver(TeamMemberCreateFormSchema),
  })

  useEffect(() => {
    if (id === DialogId.CREATE_TEAM_MEMBER && currentTeamId) {
      form.reset(
        {
          givenNames: '',
          familyName: '',
          teamId: currentTeamId,
          rateMultiplier: 1,
          teamMemberRole: TeamMemberRole.STAFF,
          username: '',
        },
        { keepDirty: false },
      )
    }
  }, [id, currentTeamId])

  const onSubmit = async (data: TeamMemberCreateFormType) => {
    if (!form.formState.isDirty) {
      form.setError('root', { message: 'There are no changes to save.' })
      return
    }
    try {
      await createMember(data)
    } catch {
      // handled in onError
    }
  }

  const cancelButton = (
    <Button variant='outline' className='ml-auto'>
      Cancel
    </Button>
  )

  return (
    <>
      <DialogTitle>New Team Member</DialogTitle>
      <FieldDescription>Create a new member to your team.</FieldDescription>
      <form id='form-create-member' onSubmit={form.handleSubmit(onSubmit)}>
        <FieldSet>
          <FieldGroup>
            <Controller
              name='givenNames'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='form-create-member-given-names'>
                    Given Name(s)
                  </FieldLabel>
                  <Input
                    {...field}
                    id='form-create-member-given-names'
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
                  <FieldLabel htmlFor='form-create-member-family-name'>
                    Last Name
                  </FieldLabel>
                  <Input
                    {...field}
                    id='form-create-member-family-name'
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
                    <FieldLabel htmlFor='form-create-member-pay-grade-id'>
                      Pay Grade
                    </FieldLabel>
                    <Popover open={payGradeOpen} onOpenChange={setPayGradeOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          id='form-create-member-pay-grade-id'
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
                <FieldLabel htmlFor='form-create-member-base-rate'>
                  Base Rate
                </FieldLabel>
                <Button
                  id='form-create-member-base-rate'
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
                    <FieldLabel htmlFor='form-create-member-rate-multiplier'>
                      Multiplier
                    </FieldLabel>
                    <Input
                      {...field}
                      id='form-create-member-rate-multiplier'
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
                  <FieldLabel htmlFor='form-create-member-username'>
                    Linked Account
                  </FieldLabel>
                  <Input
                    {...field}
                    id='form-create-member-username'
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
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    {cancelButton}
                  </AlertDialogTrigger>
                  <DiscardChangesAlertDialogContent />
                </AlertDialog>
              ) : (
                <DialogClose asChild>{cancelButton}</DialogClose>
              )}
              <Button
                type='submit'
                form='form-create-member'
                disabled={isPending}
              >
                {isPending ? <Spinner /> : 'Create'}
              </Button>
            </Field>
          </FieldGroup>
        </FieldSet>
      </form>
    </>
  )
}
