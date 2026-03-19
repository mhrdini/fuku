import { useEffect, useMemo } from 'react'
import {
  PayGradeOutput,
  ShiftTypeOutput,
  TeamMemberOutput,
} from '@fuku/api/schemas'
import {
  SchedulerAssignment,
  SchedulerAssignmentSchema,
} from '@fuku/domain/schemas'
import { DateTime } from 'luxon'
import z from 'zod'

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
}

export const useScheduleDerivedData = ({
  start,
  end,
  teamMembers,
  shiftTypes,
  payGrades,
}: ScheduleDerivedDataProps) => {
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

  const { schedulerAssignments, setSchedulerMetrics } = useScheduleStore()

  const computeShiftDurationHours = (shiftTypeId: string) => {
    const shiftType = shiftTypeMap.get(shiftTypeId)

    if (!shiftType) {
      return 0
    }

    const shiftStart = DateTime.fromFormat(shiftType.startTime, 'HH:mm')
    const shiftEnd = DateTime.fromFormat(shiftType.endTime, 'HH:mm')
    return shiftEnd.diff(shiftStart, 'hours').hours
  }

  const computeSchedulerMetrics = (
    assignments: SchedulerAssignment[],
    // start?: Date,
    // end?: Date,
  ): SchedulerMetrics => {
    const teamMemberMetricsMap = new Map<string, TeamMemberMetrics>()
    const dayMetricsMap = new Map<string, DayMetrics>()

    assignments = z.array(SchedulerAssignmentSchema).parse(assignments)

    for (const assignment of assignments) {
      if (assignment.date < start || assignment.date > end) {
        continue
      }

      const shiftDurationHours = computeShiftDurationHours(
        assignment.shiftTypeId,
      )

      const teamMemberId = assignment.teamMemberId
      const dayId = getDayId(assignment.date)

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
  }

  useEffect(() => {
    if (schedulerAssignments.length > 0 && shiftTypeMap.size > 0) {
      console.log('scheduler assignments changed:', schedulerAssignments)
      const metrics = computeSchedulerMetrics(schedulerAssignments)
      console.log('computed metrics:', metrics)
      setSchedulerMetrics(metrics)
    }
  }, [schedulerAssignments, shiftTypeMap, start, end])

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

    return map
  }, [schedulerAssignments])

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
