import { useCallback, useEffect, useMemo } from 'react'
import {
  PayGradeOutput,
  ShiftTypeOutput,
  TeamMemberOutput,
  UnavailabilityOutput,
} from '@fuku/api/schemas'
import { SchedulerAssignment } from '@fuku/domain/schemas'
import { DateTime } from 'luxon'

import {
  CellData,
  Day,
  DayMetrics,
  getCellKey,
  getDayId,
  getInitialCellData,
  SchedulerMetrics,
  TeamMemberData,
  TeamMemberMetrics,
} from '~/lib/schedule'
import { useScheduleStore } from '~/store/schedule.store'

interface ScheduleDerivedDataProps {
  start: Date
  end: Date
  teamMembers: TeamMemberOutput[] | undefined
  shiftTypes: ShiftTypeOutput[] | undefined
  payGrades: PayGradeOutput[] | undefined
  unavailabilities: UnavailabilityOutput[] | undefined
}

export const useScheduleDerivedData = ({
  start,
  end,
  teamMembers,
  shiftTypes,
  payGrades,
  unavailabilities,
}: ScheduleDerivedDataProps) => {
  const {
    schedulerAssignments,
    schedulerUnavailabilities,
    setSchedulerMetrics,
  } = useScheduleStore()

  const teamMemberMap = useMemo(() => {
    if (!teamMembers) return new Map<string, TeamMemberData>()
    const map = new Map<string, TeamMemberData>()
    for (const tm of teamMembers) {
      const teamMemberData = {
        ...tm,
        totalAssignedShifts: 0,
        totalHours: 0,
      }
      map.set(tm.id, teamMemberData)
    }
    return map
  }, [teamMembers])

  const shiftTypeMap = useMemo(() => {
    if (!shiftTypes) return new Map<string, ShiftTypeOutput>()
    const map = new Map<string, ShiftTypeOutput>()
    for (const st of shiftTypes) {
      map.set(st.id, st)
    }
    return map
  }, [shiftTypes])

  const payGradeMap = useMemo(() => {
    if (!payGrades) return new Map<string, PayGradeOutput>()
    const map = new Map<string, PayGradeOutput>()
    for (const pg of payGrades) {
      map.set(pg.id, pg)
    }
    return map
  }, [payGrades])

  const shiftDurationMap = useMemo(() => {
    const map = new Map<string, number>()

    for (const [id, st] of Array.from(shiftTypeMap.entries())) {
      const start = DateTime.fromFormat(st.startTime, 'HH:mm')
      const end = DateTime.fromFormat(st.endTime, 'HH:mm')

      let diff = end.diff(start, 'hours').hours
      if (diff < 0) diff += 24

      map.set(id, diff)
    }

    return map
  }, [shiftTypeMap])

  const computeSchedulerMetrics = useCallback(
    (
      assignments: SchedulerAssignment[],
      unavailabilities: UnavailabilityOutput[],
    ): SchedulerMetrics => {
      const teamMemberMetricsMap = new Map<string, TeamMemberMetrics>()
      const dayMetricsMap = new Map<string, DayMetrics>()
      const unavailabilitySet = new Set<string>(
        unavailabilities.map(u => getCellKey(u.teamMemberId, u.date)),
      )

      const startDate = DateTime.fromJSDate(start).startOf('day').toMillis()
      const endDate = DateTime.fromJSDate(end).endOf('day').toMillis()

      for (const assignment of assignments) {
        const assignmentDate = DateTime.fromJSDate(
          new Date(assignment.date),
        ).toMillis()

        if (assignmentDate < startDate || assignmentDate > endDate) continue

        const shiftDurationHours =
          shiftDurationMap.get(assignment.shiftTypeId) ?? 0

        const teamMemberId = assignment.teamMemberId
        const dayId = getDayId(assignment.date)
        const cellKey = getCellKey(teamMemberId, assignment.date)

        if (unavailabilitySet.has(cellKey)) continue

        const currentMemberMetrics = teamMemberMetricsMap.get(teamMemberId) ?? {
          totalAssignedShifts: 0,
          totalHours: 0,
        }

        const currentDayMetrics = dayMetricsMap.get(dayId) ?? {
          totalScheduledTeamMembers: 0,
        }

        teamMemberMetricsMap.set(teamMemberId, {
          totalAssignedShifts: currentMemberMetrics.totalAssignedShifts + 1,
          totalHours: currentMemberMetrics.totalHours + shiftDurationHours,
        })

        dayMetricsMap.set(dayId, {
          totalScheduledTeamMembers:
            // because scheduler can only create 1 assignment
            // per team member per day, we can just increment by 1
            currentDayMetrics.totalScheduledTeamMembers + 1,
        })
      }

      return { teamMemberMetricsMap, dayMetricsMap }
    },
    [shiftDurationMap, start, end],
  )

  useEffect(() => {
    if (shiftTypeMap.size > 0) {
      console.log('scheduler assignments changed:', schedulerAssignments)
      const metrics = computeSchedulerMetrics(
        schedulerAssignments,
        schedulerUnavailabilities,
      )
      console.log('computed metrics:', metrics)
      setSchedulerMetrics(metrics)
    }
  }, [
    schedulerAssignments,
    schedulerUnavailabilities,
    shiftTypeMap,
    start,
    end,
  ])

  const daysRowList = useMemo<Day[]>(() => {
    const startDT = DateTime.fromJSDate(start).startOf('day')
    const endDT = DateTime.fromJSDate(end).endOf('day')

    const days: Day[] = []
    let current = startDT

    while (current <= endDT) {
      days.push({
        id: getDayId(current.toJSDate()),
        date: current.toJSDate(),
      })

      current = current.plus({ days: 1 })
    }

    return days
  }, [start, end])

  const cellMap = useMemo(() => {
    const map = new Map<string, CellData>()

    const ensure = (cellKey: string) => {
      if (!map.has(cellKey)) {
        map.set(cellKey, getInitialCellData())
      }
      return map.get(cellKey)!
    }

    for (const a of schedulerAssignments) {
      const cellKey = getCellKey(a.teamMemberId, a.date)
      const cellData = ensure(cellKey)
      cellData.schedulerAssignments = [...cellData.schedulerAssignments, a]
    }

    for (const u of schedulerUnavailabilities) {
      const cellKey = getCellKey(u.teamMemberId, u.date)
      const cellData = ensure(cellKey)
      cellData.schedulerUnavailabilities = [
        ...cellData.schedulerUnavailabilities,
        u,
      ]
    }

    return map
  }, [schedulerAssignments, schedulerUnavailabilities])

  return {
    teamMemberMap,
    shiftTypeMap,
    payGradeMap,
    cellMap,
    daysRowList,
    computeSchedulerMetrics,
  }
}

export type ScheduleDerivedData = ReturnType<typeof useScheduleDerivedData>
