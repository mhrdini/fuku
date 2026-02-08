'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  TeamMemberCreateInput,
  TeamMemberCreateInputSchema,
} from '@fuku/api/schemas'
import { TeamMemberRoleValues } from '@fuku/db/schemas'
import {
  AlertDialog,
  AlertDialogTrigger,
  Button,
  Checkbox,
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

import { DialogId } from '~/lib/dialog'
import { useDialogStore } from '~/store/dialog'
import { useTRPC } from '~/trpc/client'
import { DiscardChangesAlertDialogContent } from '../../discard-changes-alert-dialog'

const TeamMemberCreateFormSchema = TeamMemberCreateInputSchema

type TeamMemberCreateFormType = TeamMemberCreateInput

export const CreateMemberFormDialog = () => {
  const { id, closeDialog } = useDialogStore()
  const [payGradeOpen, setPayGradeOpen] = useState(false)

  const params = useParams()
  const slug = params?.slug as string

  const queryClient = useQueryClient()
  const trpc = useTRPC()
  const { data: team } = useQuery({
    ...trpc.team.bySlug.queryOptions({ slug: slug! }),
    enabled: !!slug,
  })

  const form = useForm<TeamMemberCreateFormType>({
    defaultValues: {
      givenNames: '',
      familyName: '',
      rateMultiplier: 1,
      teamMemberRole: TeamMemberRoleValues.STAFF,
      payGradeId: null,
    },
    resolver: zodResolver(TeamMemberCreateFormSchema),
  })

  useEffect(() => {
    if (id === DialogId.CREATE_TEAM_MEMBER && team && team.id) {
      form.reset(
        {
          teamId: team.id,
          teamMemberRole: TeamMemberRoleValues.STAFF,
        },
        {
          keepDefaultValues: true,
          keepDirty: false,
        },
      )
    }
  }, [id, team])

  const { data: payGrades } = useQuery({
    ...trpc.payGrade.listDetailed.queryOptions({ teamId: team!.id }),
    enabled: !!team,
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
      queryClient.setQueryData(
        trpc.teamMember.byId.queryKey({ id: data.id }),
        data,
      )
      queryClient.invalidateQueries(
        trpc.teamMember.listIds.queryOptions({ teamId: team!.id }),
      )

      toast.success(
        `${data.givenNames} ${data.familyName} has been added to the team.`,
      )
    },
  })

  const onSubmit: SubmitHandler<TeamMemberCreateFormType> = async data => {
    if (!form.formState.isDirty) {
      form.setError('root', { message: 'There are no changes to save.' })
      return
    }
    try {
      await createMember(data)
    } catch {
      // handled in mutation onError
    }
  }

  const onError: SubmitErrorHandler<
    TeamMemberCreateFormType
  > = async errors => {
    console.log('team member create values:', form.getValues())
    console.log('team member create error:', errors)
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
      <form
        id='form-create-member'
        onSubmit={form.handleSubmit(onSubmit, onError)}
      >
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
            <Controller
              name='teamMemberRole'
              control={form.control}
              render={({ field }) => (
                <Field orientation='horizontal'>
                  <Checkbox
                    checked={field.value === TeamMemberRoleValues.ADMIN}
                    id='form-create-member-is-admin'
                    onCheckedChange={checked =>
                      field.onChange(
                        checked
                          ? TeamMemberRoleValues.ADMIN
                          : TeamMemberRoleValues.STAFF,
                      )
                    }
                  />
                  <FieldLabel
                    htmlFor='form-create-member-is-admin'
                    className='font-normal'
                  >
                    Set as team admin
                  </FieldLabel>
                </Field>
              )}
            />

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
                    value={field.value ?? ''}
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
              <LoadingButton loading={isPending}>Create</LoadingButton>
            </Field>
          </FieldGroup>
        </FieldSet>
      </form>
    </>
  )
}
