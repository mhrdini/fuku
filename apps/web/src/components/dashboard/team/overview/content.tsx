'use client'

import { useParams } from 'next/navigation'
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
import { Users } from 'lucide-react'

import { useTRPC } from '~/trpc/client'
import { DailyRequirementsSection } from './daily-requirements'
import { SummarySection } from './summary-section'

export default function TeamOverviewContent() {
  const { t } = useTranslation()
  const trpc = useTRPC()
  const params = useParams()
  const slug = params?.slug as string
  const { data: team } = useQuery({
    ...trpc.team.bySlug.queryOptions({ slug: slug! }),
    enabled: !!slug,
  })

  return team ? (
    <div className='flex flex-col gap-6'>
      <SummarySection />
      <DailyRequirementsSection teamId={team?.id ?? ''} />
    </div>
  ) : (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant='icon'>
          <Users />
        </EmptyMedia>
        <EmptyTitle>{t('noTeamsYet', 'No Teams Yet')}</EmptyTitle>
        <EmptyDescription>
          {t(
            'youHaventCreatedAnyTeamsYetGetStartedByCreatingYourFirstTeam',
            "You haven't created any teams yet. Get started by creating your first team.",
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
}
