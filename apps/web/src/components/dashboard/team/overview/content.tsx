'use client'

import { useParams } from 'next/navigation'
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
import { useQuery } from '@tanstack/react-query'
import { Users } from 'lucide-react'

import { useTRPC } from '~/trpc/client'

export default function TeamOverviewContent() {
  const trpc = useTRPC()
  const params = useParams()
  const slug = params?.slug as string
  const { data: team } = useQuery({
    ...trpc.team.bySlug.queryOptions({ slug: slug! }),
    enabled: !!slug,
  })

  return team ? (
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
          You haven&apos;t created any teams yet. Get started by creating your
          first team.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div className='flex gap-2'>
          <Button>Create Team</Button>
        </div>
      </EmptyContent>
    </Empty>
  )
}
