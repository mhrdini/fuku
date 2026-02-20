'use client'

import { useParams } from 'next/navigation'
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
        description: `${error.data?.httpStatus && ` (${error.data.httpStatus})`}: ${error.message}`,
      })
    },
    onSuccess: data => {
      queryClient.removeQueries({
        queryKey: trpc.location.byId.queryKey({ id: data.id }),
      })
      queryClient.invalidateQueries(
        trpc.location.listIds.queryOptions({ teamId: team!.id }),
      )
      queryClient.invalidateQueries(
        trpc.location.listDetailed.queryOptions({ teamId: team!.id }),
      )
      const toastId = toast('Location', {
        description: `${data.name} has been removed.`,
        action: {
          label: 'Undo',
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
      toast.error('Error', { description: `${error.message}` })
    },
    onSuccess: data => {
      queryClient.setQueryData(
        trpc.location.byId.queryKey({ id: data.id }),
        data,
      )
      queryClient.invalidateQueries(
        trpc.location.listIds.queryOptions({ teamId: team!.id }),
      )
      queryClient.invalidateQueries(
        trpc.location.listDetailed.queryOptions({ teamId: team!.id }),
      )
      toast.success('Location', {
        description: `${data.name} has been restored.`,
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
      <AlertDialogTitle>Remove Location</AlertDialogTitle>
      {isLoadingLocation ? (
        <AlertDialogDescription asChild>
          <Skeleton className='inline-block h-4 w-10' />
        </AlertDialogDescription>
      ) : (
        <AlertDialogDescription asChild>
          <div>
            <div>Are you sure you want to remove {location?.name}?</div>
            <div className='font-semibold'>
              You can restore it after deletion.
            </div>
          </div>
        </AlertDialogDescription>
      )}
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction asChild>
          <LoadingButton
            variant='destructive'
            onClick={onRemove}
            loading={isPending}
            disabled={isLoadingLocation || isPending}
            className='bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60'
          >
            Remove
          </LoadingButton>
        </AlertDialogAction>
      </AlertDialogFooter>
    </>
  )
}
