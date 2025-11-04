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
import { useSuspenseQuery } from '@tanstack/react-query'
import { Users } from 'lucide-react'

import { useTRPC } from '~/trpc/client'

export default function TeamDashboard() {
  const trpc = useTRPC()

  const { data: teams } = useSuspenseQuery(trpc.team.getAllOwned.queryOptions())

  const renderTeamContent = () => (
    <div className='flex items-center justify-between gap-4 px-4 py-2 sm:px-6 xl:gap-6'>
      <div className='flex items-center gap-4'></div>
      <div className='flex items-center gap-1.5'></div>
    </div>
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
      <h1 className='font-semibold text-xl'>{}</h1>
      {teams && teams.length > 0 ? renderTeamContent() : renderEmptyContent()}
    </Dialog>
  )
}
