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
    ...trpc.payGrade.list.queryOptions({ teamId: team!.id }),
    enabled: !!team,
    select: payGrades =>
      payGrades.find(payGrade => payGrade.id === currentPayGradeId),
  })

  const { mutateAsync: removePayGrade, isPending } = useMutation({
    ...trpc.payGrade.delete.mutationOptions(),
    onError: error => {
      toast.error(
        `ERROR${error.data?.httpStatus && ` (${error.data.httpStatus})`}: ${error.message}`,
      )
    },
    onSuccess: data => {
      queryClient.invalidateQueries(
        trpc.payGrade.list.queryOptions({ teamId: team!.id }),
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
      <AlertDialogDescription>
        Are you sure you want to remove{' '}
        {isLoadingPayGrade ? (
          <Skeleton className='inline-block h-4 w-10' />
        ) : (
          <span className='font-semibold'>{payGrade?.name}</span>
        )}
        ?
        <br />
        <span className='font-semibold'>This action cannot be undone.</span>
      </AlertDialogDescription>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction asChild>
          <Button
            variant='destructive'
            onClick={onRemove}
            disabled={isLoadingPayGrade || isPending}
            className='bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60'
          >
            Remove
          </Button>
        </AlertDialogAction>
      </AlertDialogFooter>
    </>
  )
}
