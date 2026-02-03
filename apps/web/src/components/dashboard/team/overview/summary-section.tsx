'use client'

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
} from '@fuku/ui/components'
import { useQueries, useQuery } from '@tanstack/react-query'
import { ArrowRight } from 'lucide-react'

import { useSession } from '~/components/providers/session-provider'
import { useTRPC } from '~/trpc/client'

const MAX_VISIBLE = 3

export const SummarySection = () => {
  const session = useSession()
  const params = useParams()
  const slug = params.slug as string

  const router = useRouter()
  const trpc = useTRPC()

  const { data: team } = useQuery({
    ...trpc.team.bySlug.queryOptions({ slug: slug! }),
    enabled: !!slug,
  })

  const [
    { data: members },
    { data: locations },
    { data: payGrades },
    { data: shiftTypes },
  ] = useQueries({
    queries: [
      {
        ...trpc.teamMember.list.queryOptions({ teamId: team!.id }),
        enabled: !!team,
      },
      {
        ...trpc.location.list.queryOptions({ teamId: team!.id }),
        enabled: !!team,
      },
      {
        ...trpc.payGrade.list.queryOptions({ teamId: team!.id }),
        enabled: !!team,
      },
      {
        ...trpc.shiftType.list.queryOptions({ teamId: team!.id }),
        enabled: !!team,
      },
    ],
  })

  const onManageMembers = () => {
    router.push(`/${session?.user.username}/team/${slug}/members`)
  }

  const onManageLocations = () => {
    router.push(`/${session?.user.username}/team/${slug}/locations`)
  }

  const onManageShiftTypes = () => {
    router.push(`/${session?.user.username}/team/${slug}/shift-types`)
  }

  const onManagePayGrades = () => {
    router.push(`/${session?.user.username}/team/${slug}/pay-grades`)
  }

  const teamMembersSummary = (
    <SummaryCard
      title='Team Members'
      items={members}
      renderItem={member => (
        <div key={member.id} className='flex items-center justify-between'>
          <div className='text-sm flex gap-1 items-center'>
            {member.givenNames} {member.familyName}
            {/* {member.teamMemberRole === 'ADMIN' && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Crown className='size-3 text-muted-foreground fill-current' />
                </TooltipTrigger>
                <TooltipContent side='top'>
                  <span>Admin</span>
                </TooltipContent>
              </Tooltip>
            )} */}
          </div>
          {member.payGrade && (
            <Badge variant='outline'>{member.payGrade.name}</Badge>
          )}
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
      <div className='grid grid-cols-1 @[24rem]/main:grid-cols-2 @[760px]/main:grid-cols-3 gap-4'>
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
    <Card className='min-w-[200px] border-none p-0 gap-4 *:first:mt-4'>
      <CardHeader className='px-4 gap-0'>
        <CardTitle className='text-sm'>{title}</CardTitle>
        <CardDescription className='text-xs'>
          {description ?? `${items?.length ?? 0} items`}
        </CardDescription>
      </CardHeader>
      <Separator />
      <CardContent className='flex flex-1 flex-col px-4 gap-2'>
        {items && items.length > 0 ? (
          items.slice(0, MAX_VISIBLE).map(renderItem)
        ) : (
          <div
            className='text-sm text-muted-foreground'
            aria-description='no items'
          >
            —
          </div>
        )}
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
