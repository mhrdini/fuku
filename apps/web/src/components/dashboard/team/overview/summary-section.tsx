'use client'

import { Suspense } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Separator,
  Skeleton,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@fuku/ui/components'
import { useSuspenseQueries } from '@tanstack/react-query'
import { ArrowRight, Crown } from 'lucide-react'

import { useSession } from '~/components/providers/session-provider'
import { useDashboardStore } from '~/store/dashboard'
import { useTRPC } from '~/trpc/client'

const MAX_VISIBLE = 3

export const SummarySection = () => {
  const session = useSession()
  const params = useParams()
  const currentTeamSlug = params.slug as string
  const { currentTeamId } = useDashboardStore()

  const router = useRouter()
  const trpc = useTRPC()

  const [
    { data: members },
    { data: locations },
    { data: payGrades },
    { data: shiftTypes },
  ] = useSuspenseQueries({
    queries: [
      trpc.teamMember.list.queryOptions({}),
      trpc.location.list.queryOptions({}),
      trpc.payGrade.list.queryOptions({}),
      trpc.shiftType.list.queryOptions({}),
    ],
  })

  const onManageMembers = () => {
    router.push(`/${session?.user.username}/team/${currentTeamSlug}/members`)
  }

  const onManageLocations = () => {
    router.push(`/${session?.user.username}/team/${currentTeamSlug}/locations`)
  }

  const onManageShiftTypes = () => {
    router.push(
      `/${session?.user.username}/team/${currentTeamSlug}/shift-types`,
    )
  }

  const onManagePayGrades = () => {
    router.push(`/${session?.user.username}/team/${currentTeamSlug}/pay-grades`)
  }

  const teamMembersSummary = (
    <SummaryCard
      title='Team Members'
      items={members}
      renderItem={member => (
        <div key={member.id} className='flex items-center justify-between'>
          <div className='text-sm flex gap-1 items-center'>
            {member.givenNames} {member.familyName}
            {member.teamMemberRole === 'ADMIN' && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Crown className='size-4 text-muted-foreground' />
                </TooltipTrigger>
                <TooltipContent side='right'>
                  <span>Admin</span>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          <Badge variant='outline'>{member.payGrade?.name}</Badge>
        </div>
      )}
      manageButtonText='Manage'
      onManage={onManageMembers}
    />
  )

  const locationSummary = (
    <SummaryCard
      title='Active Locations'
      items={locations}
      renderItem={location => (
        <div key={location.id} className='flex items-center justify-between'>
          <Badge variant='outline'>
            <span
              style={{ ['--bg-color' as any]: location.color }}
              className='bg-[var(--bg-color)] rounded-full size-2'
            />
            <span>{location.name}</span>
          </Badge>
        </div>
      )}
      manageButtonText='Manage'
      onManage={onManageLocations}
    />
  )

  const shiftTypesSummary = (
    <SummaryCard
      title='Shift Types'
      items={shiftTypes}
      renderItem={st => (
        <div className='flex items-center justify-between' key={st.id}>
          <Badge variant='outline'>
            <span
              style={{ ['--bg-color' as any]: st.color }}
              className='bg-[var(--bg-color)] rounded-full size-2'
            />
            <span>{st.name}</span>
          </Badge>
          <div className='text-sm text-muted-foreground'>
            {st.startTime} - {st.endTime}
          </div>
        </div>
      )}
      manageButtonText='Manage'
      onManage={onManageShiftTypes}
    />
  )

  const payGradeSummary = (
    <SummaryCard
      title='Pay Grades'
      items={payGrades}
      renderItem={pg => (
        <div key={pg.id} className='flex items-center justify-between'>
          <Badge variant='outline'>
            <span>{pg.name}</span>
          </Badge>
          <Badge variant='secondary'>{pg.baseRate.toFixed(2)}</Badge>
        </div>
      )}
      manageButtonText='Manage'
      onManage={onManagePayGrades}
    />
  )

  return (
    <div className='flex flex-col gap-4'>
      <h2>Summary</h2>
      <div className='flex gap-4'>
        {teamMembersSummary}
        {locationSummary}
        {shiftTypesSummary}
        {payGradeSummary}
      </div>
    </div>
  )
}

interface SummaryCardProps<T> {
  title: string
  items: T[] | undefined
  renderItem: (item: T) => React.ReactNode
  description?: string
  manageButtonText: string
  onManage?: () => void
}

function SummaryCard<T>({
  title,
  items,
  renderItem,
  description,
  manageButtonText,
  onManage,
}: SummaryCardProps<T>) {
  return (
    <Card className='w-[200px] md:w-1/4 border-none p-0 gap-4 *:first:mt-4'>
      <CardHeader className='px-4 gap-0'>
        <Suspense
          fallback={
            <>
              <Skeleton className='w-12 h-5' />
              <Skeleton className='w-12 h-4' />
            </>
          }
        >
          <CardTitle className='text-sm'>{title}</CardTitle>
          <CardDescription className='text-xs'>
            {description ?? `${items?.length ?? 0} items`}
          </CardDescription>
        </Suspense>
      </CardHeader>
      <Separator />
      <CardContent className='flex flex-1 flex-col px-4 gap-2'>
        <Suspense
          fallback={
            <>
              <Skeleton className='flex-1' />
              <Skeleton className='flex-1' />
              <Skeleton className='flex-1' />
            </>
          }
        >
          {items?.slice(0, MAX_VISIBLE).map(renderItem)}
        </Suspense>
      </CardContent>
      <div className='p-0 mt-auto border-t'>
        <Button
          className='w-full rounded-b-xl rounded-t-none'
          onClick={onManage}
          variant='ghost'
        >
          {manageButtonText}
          <ArrowRight />
        </Button>
      </div>
    </Card>
  )
}
