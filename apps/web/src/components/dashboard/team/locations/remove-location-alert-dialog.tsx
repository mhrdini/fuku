'use client'

import { useParams } from 'next/navigation'
import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  Button,
  Skeleton,
} from '@fuku/ui/components'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useDialogStore } from '~/store/dialog'
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
      toast.error(
        `ERROR${error.data?.httpStatus && ` (${error.data.httpStatus})`}: ${error.message}`,
      )
    },
    onSuccess: data => {
      queryClient.removeQueries({
        queryKey: trpc.location.byId.queryKey({ id: data.id }),
      })
      queryClient.invalidateQueries(
        trpc.location.listIds.queryOptions({ teamId: team!.id }),
      )
      const toastId = toast(`${data.name} has been removed.`, {
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
      toast.error(`${error.message}`)
    },
    onSuccess: data => {
      queryClient.setQueryData(
        trpc.location.byId.queryKey({ id: data.id }),
        data,
      )
      queryClient.invalidateQueries(
        trpc.location.listIds.queryOptions({ teamId: team!.id }),
      )
      toast.success(`${data.name} has been restored.`)
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
      <AlertDialogDescription>
        Are you sure you want to remove{' '}
        {isLoadingLocation ? (
          <Skeleton className='inline-block h-4 w-10' />
        ) : (
          <span className='font-semibold'>{location?.name}</span>
        )}
        ?
        <br />
        <span className='font-semibold'>
          You can restore it after deletion.
        </span>
      </AlertDialogDescription>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction asChild>
          <Button
            variant='destructive'
            onClick={onRemove}
            disabled={isLoadingLocation || isPending}
            className='bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60'
          >
            Remove
          </Button>
        </AlertDialogAction>
      </AlertDialogFooter>
    </>
  )
}
