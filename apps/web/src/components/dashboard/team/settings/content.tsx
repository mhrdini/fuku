'use client'

import { useEffect } from 'react'

import { useRouter } from 'next/navigation'

import { TeamUpdateInputSchema } from '@fuku/api/schemas'
import { useTranslation } from '@fuku/i18n/react'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  Input,
  LoadingButton,
  Textarea,
} from '@fuku/ui/components'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Controller,
  useForm,
} from 'react-hook-form'
import { toast } from 'sonner'

import type {
  SubmitErrorHandler,
  SubmitHandler,
} from 'react-hook-form'
import type * as z from 'zod/v4'

import { CountryController } from '~/components/country-controller'
import { TimeZoneController } from '~/components/timezone-controller'
import { useTRPC } from '~/trpc/client'

const TeamSettingsFormSchema = TeamUpdateInputSchema.pick({
  id: true,
  name: true,
  country: true,
  description: true,
  timeZone: true,
})
type TeamSettingsFormType = z.infer<typeof TeamSettingsFormSchema>

export function TeamSettingsContent() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const trpc = useTRPC()
  const router = useRouter()

  const { data: team, isPending } = useQuery({
    ...trpc.team.getActiveTeam.queryOptions(),
  })

  const form = useForm<TeamSettingsFormType>({
    defaultValues: {
      name: team?.name || '',
      country: team?.country || undefined,
      description: team?.description || null,
      timeZone: team?.timeZone || undefined,
    },
    resolver: zodResolver(TeamSettingsFormSchema),
  })

  const {
    formState: { isDirty },
  } = form

  useEffect(() => {
    if (team) {
      form.reset({
        name: team.name,
        country: team.country,
        description: team.description,
        timeZone: team.timeZone,
      })
    }
  }, [form, team])

  const { mutateAsync: updateTeam, isPending: isSaving } = useMutation({
    ...trpc.team.update.mutationOptions(),
    onSuccess: async (data) => {
      form.reset(form.getValues())
      queryClient.invalidateQueries(trpc.user.getSidebarState.queryOptions())
      queryClient.invalidateQueries(
        trpc.team.byPublicId.queryOptions({ publicId: data!.publicId }),
      )
      toast.success(t('team'), {
        description: t('changesSaved', 'Changes saved!'),
      })
    },
  })

  const { mutateAsync: deleteTeam, isPending: isDeleting } = useMutation({
    ...trpc.team.delete.mutationOptions(),
    onSuccess: async (data) => {
      data.team.teamMembers.forEach((member) => {
        queryClient.removeQueries(
          trpc.teamMember.byId.queryOptions({ id: member.id }),
        )
      })
      data.team.locations.forEach((location) => {
        queryClient.removeQueries(
          trpc.location.byId.queryOptions({ id: location.id }),
        )
      })
      data.team.payGrades.forEach((payGrade) => {
        queryClient.removeQueries(
          trpc.payGrade.byId.queryOptions({ id: payGrade.id }),
        )
      })
      data.team.shiftTypes.forEach((shiftType) => {
        queryClient.removeQueries(
          trpc.shiftType.byId.queryOptions({ id: shiftType.id }),
        )
      })
      queryClient.invalidateQueries(trpc.user.getSidebarState.queryOptions())
      router.push('/')
    },
  })

  const onSubmit: SubmitHandler<TeamSettingsFormType> = async (values) => {
    if (!team)
      return
    if (!isDirty) {
      form.setError('root', {
        message: t('thereAreNoChangesToSave', 'There are no changes to save.'),
      })
      return
    }

    try {
      await updateTeam(values)
    } catch {
      // TODO: handle errors
    }
  }

  const onError: SubmitErrorHandler<TeamSettingsFormType> = (errors) => {
    console.error('team settings save errors:', errors)
  }

  const handleDelete = async () => {
    if (!team)
      return
    try {
      await deleteTeam()
    } catch {
      // TODO: handle errors
    }
  }

  return (
    <div className='flex max-w-lg flex-col gap-4'>
      <h2>{t('settings', 'Settings')}</h2>
      <form
        id='form-team-settings'
        onSubmit={form.handleSubmit(onSubmit, onError)}
      >
        <FieldGroup>
          <FieldSet>
            <FieldLegend>{t('general', 'General')}</FieldLegend>
            <FieldGroup className='*:not(:last-child):grid *:not(:last-child):gap-2'>
              <Controller
                name='name'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor='form-team-settings-name'>
                      {t('teamName', 'Team Name')}
                    </FieldLabel>
                    <Input
                      id='form-team-settings-name'
                      {...field}
                      aria-invalid={fieldState.invalid}
                      placeholder={t('name')}
                      autoComplete='off'
                      disabled={isPending}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name='description'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor='form-team-settings-description'>
                      {t('description', 'Description')}
                    </FieldLabel>
                    <Textarea
                      id='form-team-settings-description'
                      {...field}
                      value={field.value || ''}
                      aria-invalid={fieldState.invalid}
                      placeholder={t('description')}
                      autoComplete='off'
                      className='h-14 resize-none overflow-y-auto'
                      disabled={isPending}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <CountryController
                control={form.control}
                resetField={form.resetField}
                disabled={isPending}
              />
              <TimeZoneController
                control={form.control}
                resetField={form.resetField}
                disabled={isPending}
              />
              <Field orientation='responsive'>
                <FieldError errors={[form.formState.errors.root]} />
                <LoadingButton
                  form='form-team-settings'
                  loading={isSaving}
                  disabled={isPending || isSaving || isDeleting}
                  className='ml-auto'
                >
                  {t('saveChanges', 'Save changes')}
                </LoadingButton>
              </Field>
            </FieldGroup>
          </FieldSet>
          <FieldSet>
            <FieldLegend>{t('dangerZone', 'Danger Zone')}</FieldLegend>
            <FieldSeparator />
            <FieldGroup className='border-destructive rounded-none border p-4 *:grid *:grid-cols-[2fr_1fr]'>
              <Field orientation='horizontal'>
                <div>
                  <FieldLabel htmlFor='form-team-settings-delete'>
                    {t('deleteThisTeam', 'Delete this team')}
                  </FieldLabel>
                  <FieldDescription>
                    {t(
                      'onceYouDeleteATeamThereIsNoGoingBack',
                      'Once you delete a team, there is no going back.',
                    )}
                  </FieldDescription>
                </div>
                <LoadingButton
                  id='form-team-settings-delete'
                  type='button'
                  loading={isDeleting}
                  disabled={isPending || isSaving || isDeleting}
                  variant='destructive'
                  onClick={handleDelete}
                  className='ml-auto'
                >
                  {t('deleteThisTeam', 'Delete this team')}
                </LoadingButton>
              </Field>
            </FieldGroup>
          </FieldSet>
        </FieldGroup>
      </form>
    </div>
  )
}
