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

export const RemoveLocationAlertDialog = () => {
  const { t } = useTranslation()
  const params = useParams()
  const slug = params?.slug as string

  const { editingId: currentLocationId } = useDialogStore()

  const queryClient = useQueryClient()
  const trpc = useTRPC()
  const { data: team } = useQuery({
    ...trpc.team.bySlug.queryOptions({ slug: slug! }),
    enabled: !!slug,
  })
  const { data: location, isPending: isLoadingLocation } = useQuery({
    ...trpc.location.byId.queryOptions({ id: currentLocationId! }),
    enabled: !!currentLocationId,
  })

  const { mutateAsync: removeLocation, isPending } = useMutation({
    ...trpc.location.delete.mutationOptions(),
    onError: error => {
      toast.error('Error', {
        description: t('valMessage', '{{val}}: {{message}}', {
          val: error.data?.httpStatus && ` (${error.data.httpStatus})`,
          message: error.message,
        }),
      })
    },
    onSuccess: data => {
      queryClient.removeQueries({
        queryKey: trpc.location.byId.queryKey({ id: data.id }),
      })
      queryClient.invalidateQueries(
        trpc.location.listIds.queryOptions({ teamId: team?.id ?? '' }),
      )
      queryClient.invalidateQueries(
        trpc.location.list.queryOptions({ teamId: team?.id ?? '' }),
      )
      const toastId = toast('Location', {
        description: t('nameHasBeenRemoved', '{{name}} has been removed.', {
          name: data.name,
        }),
        action: {
          label: t('undo', 'Undo'),
          onClick: async () => {
            await restoreLocation({ id: data.id })
            toast.dismiss(toastId)
          },
        },
      })
    },
  })

  const { mutateAsync: restoreLocation } = useMutation({
    ...trpc.location.restore.mutationOptions(),
    onError: error => {
      toast.error('Error', {
        description: t('message', '{{message}}', { message: error.message }),
      })
    },
    onSuccess: data => {
      queryClient.setQueryData(
        trpc.location.byId.queryKey({ id: data.id }),
        data,
      )
      queryClient.invalidateQueries(
        trpc.location.listIds.queryOptions({ teamId: team?.id ?? '' }),
      )
      queryClient.invalidateQueries(
        trpc.location.list.queryOptions({ teamId: team?.id ?? '' }),
      )
      toast.success('Location', {
        description: t('nameHasBeenRestored', '{{name}} has been restored.', {
          name: data.name,
        }),
      })
    },
  })

  const onRemove = async () => {
    if (!currentLocationId) return
    try {
      await removeLocation({ id: currentLocationId })
    } catch {
      // Handled in onError
    }
  }

  return (
    <>
      <AlertDialogTitle>
        {t('removeLocation', 'Remove Location')}
      </AlertDialogTitle>
      {isLoadingLocation ? (
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
              {location?.name}?
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
            disabled={isLoadingLocation || isPending}
            className='bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60'
          >
            {t('remove', 'Remove')}
          </LoadingButton>
        </AlertDialogAction>
      </AlertDialogFooter>
    </>
  )
}
