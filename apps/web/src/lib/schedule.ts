import { DateTime } from 'luxon'

import type { TeamMemberOutput, UnavailabilityOutput } from '@fuku/api/schemas'
import type { SchedulerAssignment } from '@fuku/domain/schemas'

export const ViewOptionValues = ['day', 'week', 'month'] as const
export type ViewOption = (typeof ViewOptionValues)[number]
export type Day = {
  id: string
  date: Date
}

export const widthsByView: Record<ViewOption, string> = {
  day: '1fr',
  week: '1fr',
  month: '120px',
}

export const defaultDateRangesByView: Record<
  ViewOption,
  { from: Date, to: Date }
> = {
  day: {
    from: DateTime.now().startOf('day').toJSDate(),
    to: DateTime.now().endOf('day').toJSDate(),
  },
  week: {
    // always start on monday regardless of locale
    from: DateTime.now().startOf('week').toJSDate(),
    to: DateTime.now().endOf('week').toJSDate(),
  },
  month: {
    from: DateTime.now().startOf('month').toJSDate(),
    to: DateTime.now().endOf('month').toJSDate(),
  },
}
export function getDefaultDateRangeByView(view: ViewOption, currentStart?: Date) {
  let start: DateTime

  switch (view) {
    case 'day':
      start = currentStart
        ? DateTime.fromJSDate(currentStart)
        : DateTime.now()
      return {
        from: start.startOf('day').toJSDate(),
        to: start.endOf('day').toJSDate(),
      }
    case 'week': {
      // always start on monday regardless of locale
      // even though date range picker has option to start on sunday (monday by default)
      start = currentStart
        ? DateTime.fromJSDate(currentStart).startOf('day')
        : DateTime.now().startOf('week')
      return {
        from: start.toJSDate(),
        to: start.plus({ days: 6 }).endOf('day').toJSDate(),
      }
    }
    case 'month': {
      start = currentStart
        ? DateTime.fromJSDate(currentStart).startOf('month')
        : DateTime.now().startOf('month')
      return {
        from: start.toJSDate(),
        to: start.endOf('month').toJSDate(),
      }
    }
  }
}

export type TeamMemberMetrics = {
  totalAssignedShifts: number
  totalHours: number
}

export type TeamMemberData = TeamMemberOutput & TeamMemberMetrics

export type DayMetrics = {
  totalScheduledTeamMembers: number
}

export type SchedulerMetrics = {
  teamMemberMetricsMap: Map<string, TeamMemberMetrics>
  dayMetricsMap: Map<string, DayMetrics>
}

export type CellData = {
  schedulerAssignments: SchedulerAssignment[]
  schedulerUnavailabilities: UnavailabilityOutput[]
}

export function getDayId(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date
  return DateTime.fromJSDate(d).toFormat('yyyy-MM-dd')
}

export function getCellKey(teamMemberId: string, date: Date | string) {
  const dayId = getDayId(date)
  return `${teamMemberId}_${dayId}`
}

export function splitCellKey(cellKey: string) {
  const [teamMemberId, date] = cellKey.split('_')
  return { teamMemberId, date }
}

export function parseCellKey(cellKey: string) {
  const { teamMemberId, date } = splitCellKey(cellKey)
  return {
    teamMemberId,
    date: DateTime.fromFormat(date, 'yyyy-MM-dd').toJSDate(),
  }
}

export function getInitialCellData(): CellData {
  return {
    schedulerAssignments: [],
    schedulerUnavailabilities: [],
  }
}
