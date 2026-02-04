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

export const RemoveMemberAlertDialog = () => {
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
        `ERROR${error.data?.httpStatus && ` (${error.data.httpStatus})`}: ${error.message}`,
      )
    },
    onSuccess: data => {
      queryClient.removeQueries({
        queryKey: trpc.teamMember.byId.queryKey({ id: data.id }),
      })
      queryClient.invalidateQueries(
        trpc.teamMember.listIds.queryOptions({ teamId: team!.id }),
      )
      const toastId = toast(
        `${data.givenNames} ${data.familyName} has been removed.`,
        {
          action: {
            label: 'Undo',
            onClick: async () => {
              await restoreMember({ id: data.id })
              toast.dismiss(toastId)
            },
          },
        },
      )
    },
  })

  const { mutateAsync: restoreMember } = useMutation({
    ...trpc.teamMember.restore.mutationOptions(),
    onError: error => {
      toast.error(`${error.message}`)
    },
    onSuccess: data => {
      queryClient.setQueryData(
        trpc.teamMember.byId.queryKey({ id: data.id }),
        data,
      )
      queryClient.invalidateQueries(
        trpc.teamMember.listIds.queryOptions({ teamId: team!.id }),
      )
      toast.success(`${data.givenNames} ${data.familyName} has been restored.`)
    },
  })

  const onRemove = async () => {
    if (!currentTeamMemberId) return
    try {
      await removeMember({ id: currentTeamMemberId, teamId: team!.id })
    } catch {
      // Handled in onError
    }
  }

  return (
    <>
      <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
      <AlertDialogDescription>
        Are you sure you want to remove{' '}
        {isLoadingTeamMember ? (
          <Skeleton className='inline-block h-4 w-10' />
        ) : (
          <span className='font-semibold'>
            {teamMember?.givenNames} {teamMember?.familyName}
          </span>
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
            disabled={isLoadingTeamMember || isPending}
            className='bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60'
          >
            Remove
          </Button>
        </AlertDialogAction>
      </AlertDialogFooter>
    </>
  )
}
