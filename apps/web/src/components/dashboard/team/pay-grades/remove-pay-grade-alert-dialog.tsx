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

import { useDialogStore } from '~/store/dialog'
import { useTRPC } from '~/trpc/client'

export const RemovePayGradeAlertDialog = () => {
  const queryClient = useQueryClient()
  const trpc = useTRPC()
  const params = useParams()
  const slug = params?.slug as string
  const { data: team } = useQuery({
    ...trpc.team.bySlug.queryOptions({ slug: slug! }),
    enabled: !!slug,
  })

  const { editingId: currentPayGradeId } = useDialogStore()

  const { data: payGrade, isPending: isLoadingPayGrade } = useQuery({
    ...trpc.payGrade.byId.queryOptions({ id: currentPayGradeId! }),
    enabled: !!currentPayGradeId,
  })

  const { mutateAsync: removePayGrade, isPending } = useMutation({
    ...trpc.payGrade.delete.mutationOptions(),
    onError: error => {
      toast.error(
        `ERROR${error.data?.httpStatus && ` (${error.data.httpStatus})`}: ${error.message}`,
      )
    },
    onSuccess: data => {
      queryClient.removeQueries({
        queryKey: trpc.payGrade.byId.queryKey({ id: data.id }),
      })
      queryClient.invalidateQueries(
        trpc.payGrade.listIds.queryOptions({ teamId: team!.id }),
      )
      queryClient.invalidateQueries(
        trpc.payGrade.listDetailed.queryOptions({ teamId: team!.id }),
      )
      toast(`${data.name} has been removed.`)
    },
  })

  const onRemove = async () => {
    if (!currentPayGradeId) return
    try {
      await removePayGrade({ id: currentPayGradeId, teamId: team!.id })
    } catch {
      // Handled in onError
    }
  }

  return (
    <>
      <AlertDialogTitle>Remove Pay Grade</AlertDialogTitle>
      {isLoadingPayGrade ? (
        <AlertDialogDescription asChild>
          <Skeleton className='inline-block h-4 w-10' />
        </AlertDialogDescription>
      ) : (
        <AlertDialogDescription>
          <div>Are you sure you want to remove {payGrade?.name}?</div>
          <div className='font-semibold'>This action cannot be undone.</div>
        </AlertDialogDescription>
      )}
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction asChild>
          <LoadingButton
            variant='destructive'
            onClick={onRemove}
            loading={isPending}
            disabled={isLoadingPayGrade || isPending}
            className='bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60'
          >
            Remove
          </LoadingButton>
        </AlertDialogAction>
      </AlertDialogFooter>
    </>
  )
}
