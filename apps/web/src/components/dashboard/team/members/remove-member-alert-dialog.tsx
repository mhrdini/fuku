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

export const RemoveMemberAlertDialog = () => {
  const queryClient = useQueryClient()

  const { currentTeamId } = useDashboardStore()

  const { editingId: currentTeamMemberId } = useDialogStore()

  const trpc = useTRPC()
  const { data: teamMember, isPending: isLoadingTeamMember } = useQuery({
    ...trpc.teamMember.getAllByTeam.queryOptions({
      teamId: currentTeamId!,
    }),
    select: members =>
      members.find(member => member.id === currentTeamMemberId),
  })

  const { mutateAsync: removeMember, isPending } = useMutation({
    ...trpc.teamMember.delete.mutationOptions(),
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
      queryClient.invalidateQueries({
        ...trpc.location.getAllByTeam.queryOptions({
          teamId: currentTeamId!,
        }),
      })
      toast.success(`${data.givenNames} ${data.familyName} has been restored.`)
    },
  })

  const onRemove = async () => {
    if (!currentTeamMemberId) return
    try {
      await removeMember({ id: currentTeamMemberId })
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
