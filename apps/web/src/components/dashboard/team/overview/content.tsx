'use client'

import { Suspense } from 'react'
import {
  Button,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@fuku/ui/components'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Users } from 'lucide-react'

import { ContentSkeleton } from '~/components/dashboard/content-skeleton'
import { useDashboardStore } from '~/store/dashboard'
import { useTRPC } from '~/trpc/client'
import { SummarySection } from './summary-section'

export default function TeamOverviewContent() {
  const trpc = useTRPC()
  const { currentTeamId } = useDashboardStore()

  const { data: team } = useSuspenseQuery({
    ...trpc.team.getAllOwned.queryOptions({}),
    select: teams => teams.find(team => team.id === currentTeamId),
  })

  return (
    <Suspense fallback={<ContentSkeleton />}>
      {team ? (
        <div className='flex flex-col gap-2'>
          <SummarySection />
        </div>
      ) : (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant='icon'>
              <Users />
            </EmptyMedia>
            <EmptyTitle>No Teams Yet</EmptyTitle>
            <EmptyDescription>
              You haven&apos;t created any teams yet. Get started by creating
              your first team.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <div className='flex gap-2'>
              <Button>Create Team</Button>
            </div>
          </EmptyContent>
        </Empty>
      )}
    </Suspense>
  )
}
