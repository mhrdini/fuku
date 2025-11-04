'use client'

import {
  Button,
  Dialog,
  DialogTrigger,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@fuku/ui/components'
import { useQuery } from '@tanstack/react-query'
import { Users } from 'lucide-react'

import { ContentSkeleton } from '~/components/dashboard/content-skeleton'
import { useDashboardStore } from '~/store/dashboard'
import { useTRPC } from '~/trpc/client'

export default function TeamOverviewContent() {
  const trpc = useTRPC()

  const { currentTeamSlug } = useDashboardStore()

  const { data: team, isPending } = useQuery({
    ...trpc.team.getBySlug.queryOptions({
      slug: currentTeamSlug!,
    }),
    enabled: !!currentTeamSlug,
  })

  const renderTeamContent = () => (
    <>
      <h1 className='text-xl font-semibold'>Overview</h1>
    </>
  )

  const renderEmptyContent = () => (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant='icon'>
          <Users />
        </EmptyMedia>
        <EmptyTitle>No Teams Yet</EmptyTitle>
        <EmptyDescription>
          You haven&apos;t created any teams yet. Get started by creating your
          first team.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div className='flex gap-2'>
          <DialogTrigger asChild>
            <Button>Create Team</Button>
          </DialogTrigger>
        </div>
      </EmptyContent>
    </Empty>
  )

  return (
    <Dialog>
      {isPending ? (
        <ContentSkeleton />
      ) : team ? (
        renderTeamContent()
      ) : (
        renderEmptyContent()
      )}
    </Dialog>
  )
}
