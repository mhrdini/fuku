import { useMemo, useState } from 'react'

import type { TeamMemberData } from '~/lib/schedule'
import type {
  TeamMemberGroupByKey,
  TeamMemberSortKey,
} from '~/lib/team-member'
import {
  groupTeamMembers,
  sortTeamMembers,
} from '~/lib/team-member'

export function useTeamMemberGroupBySort(
  teamMembers: TeamMemberData[],
  initialSortKey: TeamMemberSortKey | undefined = undefined,
  initialGroupByKey: TeamMemberGroupByKey | undefined = undefined,
) {
  const [sortKey, setSortKey] = useState<TeamMemberSortKey | undefined>(
    initialSortKey,
  )

  const [direction, setDirection] = useState<'asc' | 'desc'>('asc')

  const [groupByKey, setGroupByKey] = useState<
    TeamMemberGroupByKey | undefined
  >(initialGroupByKey)

  const toggleDirection = () =>
    setDirection(d => (d === 'asc' ? 'desc' : 'asc'))

  const reset = () => {
    setDirection('asc')
    setGroupByKey(undefined)
    setSortKey(undefined)
  }

  const sortedTeamMembers = useMemo(() => {
    return groupTeamMembers(teamMembers, groupByKey).flatMap(teamMembers =>
      sortTeamMembers(teamMembers, sortKey, direction),
    )
  }, [teamMembers, sortKey, groupByKey, direction])

  return {
    sortedTeamMembers,
    groupByKey,
    setGroupByKey,
    sortKey,
    setSortKey,
    direction,
    toggleDirection,
    reset,
  }
}

export type TeamMemberGroupBySort = ReturnType<typeof useTeamMemberGroupBySort>
