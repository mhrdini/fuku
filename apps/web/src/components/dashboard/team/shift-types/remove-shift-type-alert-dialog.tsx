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

export const RemoveShiftTypeAlertDialog = () => {
  const queryClient = useQueryClient()

  const { currentTeamId } = useDashboardStore()

  const { editingId: currentShiftTypeId } = useDialogStore()

  const trpc = useTRPC()
  const { data: shiftType, isPending: isLoadingShiftType } = useQuery({
    ...trpc.shiftType.getAllByTeam.queryOptions({
      teamId: currentTeamId!,
    }),
    select: shiftTypes =>
      shiftTypes.find(shiftType => shiftType.id === currentShiftTypeId),
  })

  const { mutateAsync: removeShiftType, isPending } = useMutation({
    ...trpc.shiftType.delete.mutationOptions(),
    onError: error => {
      toast.error(
        `ERROR${error.data?.httpStatus && ` (${error.data.httpStatus})`}: ${error.message}`,
      )
    },
    onSuccess: data => {
      queryClient.invalidateQueries({
        ...trpc.shiftType.getAllByTeam.queryOptions({
          teamId: currentTeamId!,
        }),
      })
      const toastId = toast(`${data.name} has been removed.`, {
        action: {
          label: 'Undo',
          onClick: async () => {
            await restoreShiftType({ id: data.id })
            toast.dismiss(toastId)
          },
        },
      })
    },
  })

  const { mutateAsync: restoreShiftType } = useMutation({
    ...trpc.shiftType.restore.mutationOptions(),
    onError: error => {
      toast.error(`${error.message}`)
    },
    onSuccess: data => {
      queryClient.invalidateQueries({
        ...trpc.shiftType.getAllByTeam.queryOptions({
          teamId: currentTeamId!,
        }),
      })
      toast.success(`${data.name} has been restored.`)
    },
  })

  const onRemove = async () => {
    if (!currentShiftTypeId) return
    try {
      await removeShiftType({ id: currentShiftTypeId })
    } catch {
      // Handled in onError
    }
  }

  return (
    <>
      <AlertDialogTitle>Remove Shift Type</AlertDialogTitle>
      <AlertDialogDescription>
        Are you sure you want to remove{' '}
        {isLoadingShiftType ? (
          <Skeleton className='inline-block h-4 w-10' />
        ) : (
          <span className='font-semibold'>{shiftType?.name}</span>
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
            disabled={isLoadingShiftType || isPending}
            className='bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60'
          >
            Remove
          </Button>
        </AlertDialogAction>
      </AlertDialogFooter>
    </>
  )
}
