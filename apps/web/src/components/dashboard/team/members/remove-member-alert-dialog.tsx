'use client'

import { useParams } from 'next/navigation'
import { useTranslation } from '@fuku/i18n/react'
import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  LoadingButton,
  Skeleton,
} from '@fuku/ui/components'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useDialogStore } from '~/store/dialog.store'
import { useTRPC } from '~/trpc/client'

export const RemoveMemberAlertDialog = () => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const trpc = useTRPC()

  const { editingId: currentTeamMemberId } = useDialogStore()

  const params = useParams()
  const slug = params?.slug as string
  const { data: team } = useQuery({
    ...trpc.team.bySlug.queryOptions({ slug: slug! }),
    enabled: !!slug,
  })

  const { data: teamMember, isPending: isLoadingTeamMember } = useQuery({
    ...trpc.teamMember.byId.queryOptions({
      id: currentTeamMemberId!,
    }),
    enabled: !!currentTeamMemberId,
  })

  const { mutateAsync: removeMember, isPending } = useMutation({
    ...trpc.teamMember.delete.mutationOptions(),
    onError: error => {
      toast.error(
        t('errorvalMessage', 'ERROR{{val}}: {{message}}', {
          val: error.data?.httpStatus && ` (${error.data.httpStatus})`,
          message: error.message,
        }),
      )
    },
    onSuccess: data => {
      queryClient.removeQueries({
        queryKey: trpc.teamMember.byId.queryKey({ id: data.id }),
      })
      queryClient.invalidateQueries(
        trpc.teamMember.listIds.queryOptions({ teamId: team?.id ?? '' }),
      )
      const toastId = toast('Team Member', {
        description: t(
          'givennamesFamilynameHasBeenRemoved',
          '{{givenNames}} {{familyName}} has been removed.',
          { givenNames: data.givenNames, familyName: data.familyName },
        ),
        action: {
          label: t('undo', 'Undo'),
          onClick: async () => {
            await restoreMember({ id: data.id })
            toast.dismiss(toastId)
          },
        },
      })
    },
  })

  const { mutateAsync: restoreMember } = useMutation({
    ...trpc.teamMember.restore.mutationOptions(),
    onError: error => {
      toast.error('Error', {
        description: t('message', '{{message}}', { message: error.message }),
      })
    },
    onSuccess: data => {
      queryClient.setQueryData(
        trpc.teamMember.byId.queryKey({ id: data.id }),
        data,
      )
      queryClient.invalidateQueries(
        trpc.teamMember.listIds.queryOptions({ teamId: team?.id ?? '' }),
      )
      toast.success('Team Member', {
        description: t(
          'givennamesFamilynameHasBeenRestored',
          '{{givenNames}} {{familyName}} has been restored.',
          { givenNames: data.givenNames, familyName: data.familyName },
        ),
      })
    },
  })

  const onRemove = async () => {
    if (!currentTeamMemberId) return
    try {
      await removeMember({ id: currentTeamMemberId, teamId: team?.id ?? '' })
    } catch {
      // Handled in onError
    }
  }

  return (
    <>
      <AlertDialogTitle>
        {t('removeTeamMember', 'Remove Team Member')}
      </AlertDialogTitle>
      {isLoadingTeamMember ? (
        <AlertDialogDescription asChild>
          <Skeleton className='inline-block h-4 w-10' />
        </AlertDialogDescription>
      ) : (
        <AlertDialogDescription asChild>
          <div>
            <div>
              {t(
                'areYouSureYouWantToRemove',
                'Are you sure you want to remove',
              )}{' '}
              {teamMember?.givenNames}?
            </div>
            <div className='font-semibold'>
              {t(
                'youCanRestoreItAfterDeletion',
                'You can restore it after deletion.',
              )}
            </div>
          </div>
        </AlertDialogDescription>
      )}
      <AlertDialogFooter>
        <AlertDialogCancel>{t('cancel', 'Cancel')}</AlertDialogCancel>
        <AlertDialogAction asChild>
          <LoadingButton
            variant='destructive'
            onClick={onRemove}
            loading={isPending}
            disabled={isLoadingTeamMember || isPending}
            className='bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60'
          >
            {t('remove', 'Remove')}
          </LoadingButton>
        </AlertDialogAction>
      </AlertDialogFooter>
    </>
  )
}
