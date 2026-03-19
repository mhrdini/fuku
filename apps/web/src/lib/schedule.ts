import { TeamMemberOutput } from '@fuku/api/schemas'
import { SchedulerAssignment } from '@fuku/domain/schemas'
import { DateTime } from 'luxon'

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
  { from: Date; to: Date }
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

export const getDefaultDateRangeByView = (
  view: ViewOption,
  currentStart?: Date,
) => {
  switch (view) {
    case 'day':
      const day = currentStart
        ? DateTime.fromJSDate(currentStart)
        : DateTime.now()
      return {
        from: day.startOf('day').toJSDate(),
        to: day.endOf('day').toJSDate(),
      }
    case 'week': {
      // always start on monday regardless of locale
      // even though date range picker has option to start on sunday (monday by default)
      const start = currentStart
        ? DateTime.fromJSDate(currentStart).startOf('day')
        : DateTime.now().startOf('week')
      return {
        from: start.toJSDate(),
        to: start.plus({ days: 6 }).endOf('day').toJSDate(),
      }
    }
    case 'month': {
      const start = currentStart
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
  // unavailabilities: Unavailability[]
}

export const getDayId = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date
  return DateTime.fromJSDate(d).toFormat('yyyy-MM-dd')
}

export const getCellKey = (teamMemberId: string, date: Date) =>
  `${teamMemberId}-${getDayId(date)}`

export const getInitialCellData = (): CellData => ({
  schedulerAssignments: [],
})
