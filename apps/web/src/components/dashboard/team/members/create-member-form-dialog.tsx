'use client'

import { useEffect, useState } from 'react'

import {
  TeamMemberCreateInputSchema,
} from '@fuku/api/schemas'
import { TeamMemberRoleValues } from '@fuku/domain/schemas'
import { useTranslation } from '@fuku/i18n/react'
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
import { CheckIcon, ChevronDownIcon } from 'lucide-react'
import {
  Controller,
  useForm,
  useWatch,
} from 'react-hook-form'
import { toast } from 'sonner'

import type {
  TeamMemberCreateInput,
} from '@fuku/api/schemas'
import type {
  SubmitErrorHandler,
  SubmitHandler,
} from 'react-hook-form'

import { useCommittedNumberField } from '~/hooks/rule-panel/use-committed-number-field'
import type { TeamMemberDraft } from '~/store/dialog.store'
import { useDialogStore } from '~/store/dialog.store'
import { useTRPC } from '~/trpc/client'

import { DiscardChangesAlertDialogContent } from '../../discard-changes-alert-dialog'

const TeamMemberCreateFormSchema = TeamMemberCreateInputSchema

type TeamMemberCreateFormType = TeamMemberCreateInput

export function CreateMemberFormDialog() {
  const { t } = useTranslation()
  const { closeDialog, createMemberDraft, setCreateMemberDraft, clearCreateMemberDraft } = useDialogStore()
  const [payGradeOpen, setPayGradeOpen] = useState(false)

  const queryClient = useQueryClient()
  const trpc = useTRPC()
  const { data: team } = useQuery({
    ...trpc.team.getActiveTeam.queryOptions(),
  })

  const form = useForm<TeamMemberCreateFormType>({
    defaultValues: createMemberDraft ?? ({
      givenNames: '',
      familyName: '',
      rateMultiplier: 1,
      teamMemberRole: TeamMemberRoleValues.STAFF,
      payGradeId: null,
    }),
    resolver: zodResolver(TeamMemberCreateFormSchema),
  })

  const rateMultiplier = useWatch({
    control: form.control,
    name: 'rateMultiplier',

  })

  const rateMultiplierField = useCommittedNumberField(
    rateMultiplier,
    value => form.setValue('rateMultiplier', value ?? 1, {
      shouldValidate: true,
      shouldTouch: true,
      shouldDirty: true,
    }),
  )

  useEffect(() => {
    if (team?.id && !form.getValues('teamId')) {
      form.setValue('teamId', team.id, {
        shouldDirty: false,
      })
    }
  }, [team?.id, form])

  useEffect(() => {
    const subscription = form.watch((values) => {
      setCreateMemberDraft(values as TeamMemberDraft)
    })

    return () => subscription.unsubscribe()
  }, [form, setCreateMemberDraft])

  const { data: payGrades } = useQuery({
    ...trpc.payGrade.list.queryOptions({ teamId: team?.id ?? '' }),
    enabled: !!team,
  })

  const { mutateAsync: createMember, isPending } = useMutation({
    ...trpc.teamMember.create.mutationOptions(),
    onError: (error) => {
      toast.error(t('error'), {
        description: t('valMessage', '{{val}}: {{message}}', {
          val: error.data?.httpStatus && ` (${error.data.httpStatus})`,
          message: error.message,
        }),
      })
    },
    onSuccess: (data) => {
      form.reset()
      clearCreateMemberDraft()

      closeDialog()
      queryClient.setQueryData(
        trpc.teamMember.byId.queryKey({ id: data.id }),
        data,
      )
      queryClient.invalidateQueries(
        trpc.teamMember.listIds.queryOptions({}),
      )

      toast.success(t('teamMember'), {
        description: t(
          'givennamesFamilynameHasBeenAddedToTheTeam',
          '{{givenNames}} {{familyName}} has been added to the team.',
          { givenNames: data.givenNames, familyName: data.familyName },
        ),
      })
    },
  })

  const onSubmit: SubmitHandler<TeamMemberCreateFormType> = async (data) => {
    if (!form.formState.isDirty) {
      form.setError('root', {
        message: t('thereAreNoChangesToSave', 'There are no changes to save.'),
      })
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
  > = async (errors) => {
    console.error('team member create values:', form.getValues())
    console.error('team member create error:', errors)
  }

  const cancelButton = (
    <Button variant='outline' className='ml-auto'>
      {t('cancel', 'Cancel')}
    </Button>
  )

  return (
    <>
      <DialogTitle>
        <div className='flex items-center'>
          <div>{t('newTeamMember2', 'New Team Member')}</div>
          {/* <div className={cn(
            'ml-auto text-xs text-muted-foreground flex items-center',
            !form.formState.isDirty && 'hidden',
          )}
          >
            <span>Draft</span>
          </div> */}
        </div>
      </DialogTitle>
      <FieldDescription>
        {t('createANewMemberToYourTeam', 'Create a new member to your team.')}
      </FieldDescription>
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
                    {t('givenNames', 'Given Name(s)')}
                  </FieldLabel>
                  <Input
                    {...field}
                    id='form-create-member-given-names'
                    aria-invalid={fieldState.invalid}
                    placeholder={t('givenNames', 'Given Name(s)')}
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
                    {t('lastName', 'Last Name')}
                  </FieldLabel>
                  <Input
                    {...field}
                    id='form-create-member-family-name'
                    aria-invalid={fieldState.invalid}
                    placeholder={t('lastName', 'Last Name')}
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
                      {t('payGrade', 'Pay Grade')}
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
                            : t('selectPayGrade', 'Select pay grade...')}
                          <ChevronDownIcon className='opacity-50' />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className='p-0' align='start'>
                        <Command>
                          <CommandList>
                            <CommandEmpty>
                              {t('noPayGradeFound', 'No pay grade found.')}
                            </CommandEmpty>
                            <CommandGroup>
                              {payGrades?.map(pg => (
                                <CommandItem
                                  key={pg.id}
                                  value={pg.id}
                                  onSelect={(currentValue) => {
                                    form.setValue('payGradeId', currentValue, {
                                      shouldValidate: true,
                                      shouldTouch: true,
                                      shouldDirty: true,
                                    })
                                    setPayGradeOpen(false)
                                  }}
                                >
                                  {pg.name}
                                  <CheckIcon
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
                  {t('baseRate', 'Base Rate')}
                </FieldLabel>
                <Button
                  id='form-create-member-base-rate'
                  variant='outline'
                  disabled
                  className='items-center justify-start disabled:opacity-100'
                >
                  {payGrades && form.getValues('payGradeId')
                    ? (
                        payGrades.find(pg => pg.id === form.getValues('payGradeId'))
                          ?.baseRate
                      )
                    : (
                        <span className='text-muted-foreground'>N/A</span>
                      )}
                </Button>
              </Field>
              <Field
                data-invalid={!!form.formState.errors.rateMultiplier}
                className='col-span-1'
              >
                <FieldLabel htmlFor='form-create-member-rate-multiplier'>
                  {t('multiplier', 'Multiplier')}
                </FieldLabel>
                <Input
                  {...rateMultiplierField.inputProps}
                  id='form-create-member-rate-multiplier'
                  type='number'
                  step='0.01'
                  min='1'
                  aria-invalid={!!form.formState.errors.rateMultiplier}
                  placeholder={t('rateMultiplier', 'Rate Multiplier')}
                  autoComplete='off'
                />
                {form.formState.errors.rateMultiplier && (
                  <FieldError
                    errors={[form.formState.errors.rateMultiplier]}
                  />
                )}
              </Field>
            </div>
            {/* <Controller
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
                      )}
                  />
                  <FieldLabel
                    htmlFor='form-create-member-is-admin'
                    className='font-normal'
                  >
                    {t('setAsTeamAdmin', 'Set as team admin')}
                  </FieldLabel>
                </Field>
              )}
            /> */}

            <FieldSeparator />
            <Controller
              name='username'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor='form-create-member-username'>
                    {t('linkedAccount', 'Linked Account')}
                  </FieldLabel>
                  <Input
                    {...field}
                    value={field.value ?? ''}
                    id='form-create-member-username'
                    aria-invalid={fieldState.invalid}
                    placeholder={t('usernameOptional', 'Username (optional)')}
                  />
                  <FieldDescription>
                    {t(
                      'linkThisMemberToAnExistingUserAccount',
                      'Link this member to an existing user account.',
                    )}
                  </FieldDescription>
                </Field>
              )}
            />
            <Field orientation='horizontal'>
              <FieldError errors={[form.formState.errors.root]} />
              {form.formState.isDirty
                ? (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        {cancelButton}
                      </AlertDialogTrigger>
                      <DiscardChangesAlertDialogContent />
                    </AlertDialog>
                  )
                : (
                    <DialogClose asChild>{cancelButton}</DialogClose>
                  )}
              <LoadingButton loading={isPending}>
                {t('create', 'Create')}
              </LoadingButton>
            </Field>
          </FieldGroup>
        </FieldSet>
      </form>
    </>
  )
}
