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
  const [filteredPayGrades, setFilteredPayGrades] = useState<Set<string>>(
    new Set(),
  )

  const shiftTypeFilterId = useId()
  const [filteredShiftTypes, setFilteredShiftTypes] = useState<Set<string>>(
    new Set(),
  )

  // pay grades methods
  const resetFilteredPayGrades = () => {
    setFilteredPayGrades(new Set())
  }

  const togglePayGrade = (value: string) => {
    setFilteredPayGrades(prev => {
      const next = new Set(prev)
      if (next.has(value)) {
        next.delete(value)
      } else {
        next.add(value)
      }
      return next
    })
  }

  const removePayGrade = (value: string) => {
    setFilteredPayGrades(prev => {
      const next = new Set(prev)
      next.delete(value)
      return next
    })
  }

  // shift types methods
  // shift types methods
  const resetFilteredShiftTypes = () => {
    setFilteredShiftTypes(new Set())
  }

  const toggleShiftType = (id: string) => {
    setFilteredShiftTypes(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const removeShiftType = (id: string) => {
    setFilteredShiftTypes(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }
  // search
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

    if (filteredPayGrades.size > 0) {
      filtered = filtered.filter(
        (tm: TeamMemberOutput) =>
          tm.payGradeId && filteredPayGrades.has(tm.payGradeId),
      )
    }

    return filtered
  }, [teamMembers, search, teamMemberMetricsMap, filteredPayGrades])

  return {
    payGradeFilterId,
    filteredPayGrades,
    togglePayGrade,
    removePayGrade,
    resetFilteredPayGrades,
    shiftTypeFilterId,
    filteredShiftTypes,
    toggleShiftType,
    removeShiftType,
    resetFilteredShiftTypes,
    search,
    setSearch,
    filteredTeamMembers,
  }
}

export type ScheduleFilters = ReturnType<typeof useScheduleFilters>
