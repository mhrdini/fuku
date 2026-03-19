import { useId, useMemo, useState } from 'react'
import { TeamMemberOutput } from '@fuku/api/schemas'

import { TeamMemberData } from '~/lib/schedule'
import { useScheduleStore } from '~/store/schedule.store'

interface ScheduleFiltersProps {
  teamMembers: TeamMemberOutput[]
}

export const useScheduleFilters = ({ teamMembers }: ScheduleFiltersProps) => {
  const { teamMemberMetricsMap } = useScheduleStore()

  const payGradeFilterId = useId()
  const [filteredPayGrades, setFilteredPayGrades] = useState<string[]>([])
  const togglePayGrade = (value: string) => {
    setFilteredPayGrades(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value],
    )
  }
  const removePayGrade = (value: string) => {
    setFilteredPayGrades(prev => prev.filter(v => v !== value))
  }

  const [search, setSearch] = useState('')

  const filteredTeamMembers: TeamMemberData[] = useMemo(() => {
    if (!teamMembers) return []
    let filtered = teamMembers
      .map(tm => ({
        ...tm,
        ...(teamMemberMetricsMap?.get(tm.id) || {
          totalAssignedShifts: 0,
          totalHours: 0,
        }),
      }))
      .filter(tm => tm.givenNames.toLowerCase().includes(search.toLowerCase()))

    if (filteredPayGrades.length > 0) {
      const filteredPayGradeIds = new Set(filteredPayGrades)
      filtered = filtered.filter(
        (tm: TeamMemberOutput) =>
          tm.payGradeId && filteredPayGradeIds.has(tm.payGradeId),
      )
    }

    return filtered
  }, [teamMembers, search, teamMemberMetricsMap, filteredPayGrades])

  return {
    search,
    setSearch,
    payGradeFilterId,
    filteredPayGrades,
    togglePayGrade,
    removePayGrade,
    filteredTeamMembers,
  }
}

export type ScheduleFilters = ReturnType<typeof useScheduleFilters>
