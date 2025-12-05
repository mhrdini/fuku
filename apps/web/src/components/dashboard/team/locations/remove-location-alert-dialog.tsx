'use client'

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

import { useDashboardStore } from '~/store/dashboard'
import { useDialogStore } from '~/store/dialog'
import { useTRPC } from '~/trpc/client'

export const RemoveLocationAlertDialog = () => {
  const queryClient = useQueryClient()

  const { currentTeamId } = useDashboardStore()

  const { editingId: currentLocationId } = useDialogStore()

  const trpc = useTRPC()
  const { data: location, isPending: isLoadingLocation } = useQuery({
    ...trpc.location.getAllByTeam.queryOptions({
      teamId: currentTeamId!,
    }),
    select: locations =>
      locations.find(location => location.id === currentLocationId),
  })

  const { mutateAsync: removeLocation, isPending } = useMutation({
    ...trpc.location.delete.mutationOptions(),
    onError: error => {
      toast.error(
        `ERROR${error.data?.httpStatus && ` (${error.data.httpStatus})`}: ${error.message}`,
      )
    },
    onSuccess: data => {
      queryClient.invalidateQueries({
        ...trpc.location.getAllByTeam.queryOptions({
          teamId: currentTeamId!,
        }),
      })
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
      queryClient.invalidateQueries({
        ...trpc.location.getAllByTeam.queryOptions({
          teamId: currentTeamId!,
        }),
      })
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
