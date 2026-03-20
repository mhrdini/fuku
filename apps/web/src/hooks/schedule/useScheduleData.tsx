import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'

import { useTRPC } from '~/trpc/client'

interface ScheduleDataProps {
  start: Date
  end: Date
}

export const useScheduleData = ({ start, end }: ScheduleDataProps) => {
  const params = useParams()
  const slug = params.slug as string
  const trpc = useTRPC()

  // API data

  const { data: team } = useQuery({
    ...trpc.team.bySlug.queryOptions({ slug: slug! }),
    enabled: !!slug,
    refetchOnWindowFocus: false,
  })

  const { data: teamMembers } = useQuery({
    ...trpc.teamMember.list.queryOptions({ teamId: team?.id ?? '' }),
    enabled: !!team,
    refetchOnWindowFocus: false,
  })

  const { data: shiftTypes } = useQuery({
    ...trpc.shiftType.list.queryOptions({ teamId: team?.id ?? '' }),
    enabled: !!team,
    refetchOnWindowFocus: false,
  })

  const { data: payGrades } = useQuery({
    ...trpc.payGrade.list.queryOptions({ teamId: team?.id ?? '' }),
    enabled: !!team,
    refetchOnWindowFocus: false,
  })

  const { data: dbAssignments } = useQuery({
    ...trpc.dayAssignment.list.queryOptions({
      teamId: team?.id ?? '',
      start: start,
      end: end,
    }),
    enabled: !!team,
    refetchOnWindowFocus: false,
  })

  const { data: dbUnavailabilities } = useQuery({
    ...trpc.unavailability.list.queryOptions({
      teamId: team?.id ?? '',
      start: start,
      end: end,
    }),
    enabled: !!team,
    refetchOnWindowFocus: false,
  })

  const { data: rules } = useQuery({
    ...trpc.rule.groupById.queryOptions({ teamId: team?.id ?? '' }),
    enabled: !!team,
    refetchOnWindowFocus: false,
  })

  const { data: ruleConditions } = useQuery({
    ...trpc.ruleCondition.groupByRules.queryOptions({
      teamId: team?.id ?? '',
    }),
    enabled: !!team,
    refetchOnWindowFocus: false,
  })

  return {
    team,
    teamMembers,
    shiftTypes,
    payGrades,
    dbAssignments,
    dbUnavailabilities,
    rules,
    ruleConditions,
  }
}

export type ScheduleData = ReturnType<typeof useScheduleData>
