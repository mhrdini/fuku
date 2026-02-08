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

export const RemoveShiftTypeAlertDialog = () => {
  const queryClient = useQueryClient()
  const trpc = useTRPC()
  const params = useParams()
  const slug = params?.slug as string
  const { data: team } = useQuery({
    ...trpc.team.bySlug.queryOptions({ slug: slug! }),
    enabled: !!slug,
  })

  const { editingId: currentShiftTypeId } = useDialogStore()

  const { data: shiftType, isPending: isLoadingShiftType } = useQuery({
    ...trpc.shiftType.byId.queryOptions({ id: currentShiftTypeId! }),
    enabled: !!currentShiftTypeId,
  })

  const { mutateAsync: removeShiftType, isPending } = useMutation({
    ...trpc.shiftType.delete.mutationOptions(),
    onError: error => {
      toast.error(
        `ERROR${error.data?.httpStatus && ` (${error.data.httpStatus})`}: ${error.message}`,
      )
    },
    onSuccess: data => {
      queryClient.removeQueries({
        queryKey: trpc.shiftType.byId.queryKey({ id: data.id }),
      })
      queryClient.invalidateQueries(
        trpc.shiftType.listIds.queryOptions({ teamId: team!.id }),
      )
      queryClient.invalidateQueries(
        trpc.shiftType.listDetailed.queryOptions({ teamId: team!.id }),
      )
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
      queryClient.setQueryData(
        trpc.shiftType.byId.queryKey({ id: data.id }),
        data,
      )
      queryClient.invalidateQueries(
        trpc.shiftType.listIds.queryOptions({ teamId: team!.id }),
      )
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
