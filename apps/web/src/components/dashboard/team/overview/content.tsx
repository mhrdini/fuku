'use client'

import { useTranslation } from '@fuku/i18n/react'
import {
  Button,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@fuku/ui/components'
import { useQuery } from '@tanstack/react-query'
import { UsersIcon } from 'lucide-react'

import { TeamOverviewSkeleton } from '~/components/skeletons/team/overview'
import { useTRPC } from '~/trpc/client'

import { ScheduleRequirements } from '../../schedule-requirements'
import { SummarySection } from './summary-section'

export default function TeamOverviewContent() {
  const { t } = useTranslation()
  const trpc = useTRPC()
  const { data: team, isSuccess } = useQuery({
    ...trpc.team.getActiveTeam.queryOptions(),
  })

  return !isSuccess
    ? (
        <TeamOverviewSkeleton />
      )
    : (
        team
          ? (
              <div className='flex flex-col gap-6'>
                <SummarySection />
                <ScheduleRequirements teamId={team?.id ?? ''} />
              </div>
            )
          : (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant='icon'>
                    <UsersIcon />
                  </EmptyMedia>
                  <EmptyTitle>{t('noTeamsYet', 'No Teams Yet')}</EmptyTitle>
                  <EmptyDescription>
                    {t(
                      'youHaventCreatedAnyTeamsYetGetStartedByCreatingYourFirstTeam',
                      'You haven\'t created any teams yet. Get started by creating your first team.',
                    )}
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <div className='flex gap-2'>
                    <Button>{t('createTeam', 'Create Team')}</Button>
                  </div>
                </EmptyContent>
              </Empty>
            )
      )
}
