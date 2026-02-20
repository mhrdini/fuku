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
      toast.error('Error', {
        description: `${error.data?.httpStatus && ` (${error.data.httpStatus})`}: ${error.message}`,
      })
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
      const toastId = toast('Shift type', {
        description: `${data.name} has been removed.`,
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
      toast.error('Error', { description: `${error.message}` })
    },
    onSuccess: data => {
      queryClient.setQueryData(
        trpc.shiftType.byId.queryKey({ id: data.id }),
        data,
      )
      queryClient.invalidateQueries(
        trpc.shiftType.listIds.queryOptions({ teamId: team!.id }),
      )
      toast.success('Shift type', {
        description: `${data.name} has been restored.`,
      })
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
      {isLoadingShiftType ? (
        <AlertDialogDescription asChild>
          <Skeleton className='inline-block h-4 w-10' />
        </AlertDialogDescription>
      ) : (
        <AlertDialogDescription asChild>
          <div>
            <div>Are you sure you want to remove {shiftType?.name}?</div>
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
            disabled={isLoadingShiftType || isPending}
            className='bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60'
          >
            Remove
          </LoadingButton>
        </AlertDialogAction>
      </AlertDialogFooter>
    </>
  )
}
