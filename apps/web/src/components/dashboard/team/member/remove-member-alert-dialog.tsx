'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  Button,
  Spinner,
} from '@fuku/ui/components'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useTeamMemberStore } from '~/store/member'
import { useTRPC } from '~/trpc/client'

interface RemoveMemberAlertDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const RemoveMemberAlertDialog = ({
  open,
  onOpenChange,
}: RemoveMemberAlertDialogProps) => {
  const queryClient = useQueryClient()
  const { currentTeamMemberId } = useTeamMemberStore()

  const trpc = useTRPC()
  const { data: teamMember } = useQuery({
    ...trpc.teamMember.getById.queryOptions({
      id: currentTeamMemberId!,
    }),
    enabled: !!currentTeamMemberId,
  })

  const { mutateAsync: removeMember } = useMutation({
    ...trpc.teamMember.delete.mutationOptions(),
    onError: error => {
      toast.error(
        `ERROR${error.data?.httpStatus && ` (${error.data.httpStatus})`}: ${error.message}`,
      )
    },
    onSuccess: data => {
      queryClient.invalidateQueries({
        queryKey: trpc.team.getTeamMembersBySlug.queryKey(),
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
        queryKey: trpc.team.getTeamMembersBySlug.queryKey(),
      })
      toast.success(
        `Undo remove ${data.givenNames} ${data.familyName} successful.`,
      )
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
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {!teamMember ? (
        <Spinner />
      ) : (
        <AlertDialogContent>
          <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove{' '}
            <span className='font-semibold'>
              {teamMember?.givenNames} {teamMember?.familyName}
            </span>
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
                className='bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60'
              >
                Remove
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      )}
    </AlertDialog>
  )
}
