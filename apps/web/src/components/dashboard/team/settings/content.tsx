'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { TeamUpdateInputSchema } from '@fuku/api/schemas'
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
  SubmitErrorHandler,
  SubmitHandler,
  useForm,
} from 'react-hook-form'
import { toast } from 'sonner'
import z from 'zod/v4'

import { TimeZoneController } from '~/components/timezone-controller'
import { useTRPC } from '~/trpc/client'

const TeamSettingsFormSchema = TeamUpdateInputSchema.pick({
  id: true,
  name: true,
  description: true,
  timeZone: true,
})
type TeamSettingsFormType = z.infer<typeof TeamSettingsFormSchema>

export const TeamSettingsContent = () => {
  const queryClient = useQueryClient()
  const trpc = useTRPC()
  const params = useParams()
  const slug = params?.slug as string
  const router = useRouter()

  const {
    data: team,
    isSuccess,
    isPending,
  } = useQuery({
    ...trpc.team.bySlug.queryOptions({ slug: slug! }),
    enabled: !!slug,
  })

  const form = useForm<TeamSettingsFormType>({
    defaultValues: {
      id: team?.id || '',
      name: team?.name || '',
      description: team?.description || null,
      timeZone: team?.timeZone || '',
    },
    resolver: zodResolver(TeamSettingsFormSchema),
  })

  const {
    formState: { isDirty },
  } = form

  useEffect(() => {
    if (isSuccess && team) {
      form.reset({
        id: team.id,
        name: team.name,
        description: team.description,
        timeZone: team.timeZone,
      })
    }
  }, [isSuccess, team])

  const { mutateAsync: updateTeam, isPending: isSaving } = useMutation({
    ...trpc.team.update.mutationOptions(),
    onSuccess: async data => {
      form.reset(form.getValues())
      queryClient.invalidateQueries(trpc.user.getSidebarState.queryOptions())
      queryClient.invalidateQueries(
        trpc.team.bySlug.queryOptions({ slug: data!.slug }),
      )
      toast.success('Team', {
        description: 'Changes saved!',
      })
    },
  })

  const { mutateAsync: deleteTeam, isPending: isDeleting } = useMutation({
    ...trpc.team.delete.mutationOptions(),
    onSuccess: async data => {
      data.team.teamMembers.forEach(member => {
        queryClient.removeQueries(
          trpc.teamMember.byId.queryOptions({ id: member.id }),
        )
      })
      data.team.locations.forEach(location => {
        queryClient.removeQueries(
          trpc.location.byId.queryOptions({ id: location.id }),
        )
      })
      data.team.payGrades.forEach(payGrade => {
        queryClient.removeQueries(
          trpc.payGrade.byId.queryOptions({ id: payGrade.id }),
        )
      })
      data.team.shiftTypes.forEach(shiftType => {
        queryClient.removeQueries(
          trpc.shiftType.byId.queryOptions({ id: shiftType.id }),
        )
      })
      queryClient.invalidateQueries(trpc.user.getSidebarState.queryOptions())
      router.push('/')
    },
  })

  const onSubmit: SubmitHandler<TeamSettingsFormType> = async values => {
    // console.log('team settings save values:', values)
    // console.log('team settings form default:', form.formState.defaultValues)
    // console.log('team settings form dirty fields:', form.formState.dirtyFields)
    // console.log('team settings form is dirty:', form.formState.isDirty)

    if (!team) return
    if (!isDirty) {
      form.setError('root', { message: 'There are no changes to save.' })
      return
    }

    try {
      await updateTeam(values)
    } catch {
      // TODO: handle errors
    }
  }

  const onError: SubmitErrorHandler<TeamSettingsFormType> = errors => {
    console.log('team settings save errors:', errors)
  }

  const handleDelete = async () => {
    if (!team) return
    try {
      await deleteTeam({ id: team.id })
    } catch {
      // TODO: handle errors
    }
  }

  return (
    <div className='flex flex-col gap-4 max-w-lg'>
      <h2>Settings</h2>
      <form
        id='form-team-settings'
        onSubmit={form.handleSubmit(onSubmit, onError)}
      >
        <FieldGroup>
          <FieldSet>
            <FieldLegend>General</FieldLegend>
            <FieldSeparator />
            <FieldGroup className='*:not(:last-child):grid *:not(:last-child):gap-2'>
              <Controller
                name='name'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor='form-team-settings-name'>
                      Team Name
                    </FieldLabel>
                    <Input
                      id='form-team-settings-name'
                      {...field}
                      aria-invalid={fieldState.invalid}
                      placeholder='Name'
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
                      Description
                    </FieldLabel>
                    <Textarea
                      id='form-team-settings-description'
                      {...field}
                      value={field.value || ''}
                      aria-invalid={fieldState.invalid}
                      placeholder='Description'
                      autoComplete='off'
                      className='resize-none h-14 overflow-y-auto'
                      disabled={isPending}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
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
                  Save changes
                </LoadingButton>
              </Field>
            </FieldGroup>
          </FieldSet>
          <FieldSet>
            <FieldLegend>Danger Zone</FieldLegend>
            <FieldSeparator />
            <FieldGroup className='p-4 rounded-md border border-destructive *:grid *:grid-cols-[2fr_1fr]'>
              <Field orientation='horizontal'>
                <div>
                  <FieldLabel htmlFor='form-team-settings-delete'>
                    Delete this team
                  </FieldLabel>
                  <FieldDescription>
                    Once you delete a team, there is no going back.
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
                  Delete this team
                </LoadingButton>
              </Field>
            </FieldGroup>
          </FieldSet>
        </FieldGroup>
      </form>
    </div>
  )
}
