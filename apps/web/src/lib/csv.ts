import { ShiftTypeOutput, TeamMemberOutput } from '@fuku/api/schemas'
import { SchedulerAssignment } from '@fuku/domain/schemas'
import { DateTime } from 'luxon'

import { getShiftTypeName } from './shift-types'
import { getTeamMemberName } from './team-member'

function escapeCSV(value: string): string {
  const escaped = value.replace(/"/g, '""')

  return `"${escaped}"`
}

export function convertToCSV(
  data: SchedulerAssignment[],
  teamMemberById: Record<string, TeamMemberOutput>,
  shiftTypeById: Record<string, ShiftTypeOutput>,
  startDate: Date,
  endDate: Date,
): string {
  // --------------------------------------------
  // Filter assignments by date range
  // --------------------------------------------

  const filteredData = data.filter(assignment => {
    const assignmentDate = DateTime.fromISO(String(assignment.date)).startOf(
      'day',
    )

    return (
      assignmentDate >= DateTime.fromJSDate(startDate).startOf('day') &&
      assignmentDate <= DateTime.fromJSDate(endDate).startOf('day')
    )
  })

  // --------------------------------------------
  // Team members (columns)
  // --------------------------------------------

  const teamMemberIds = Array.from(
    new Set(filteredData.map(a => a.teamMemberId)),
  )

  teamMemberIds.sort((a, b) => {
    const nameA = getTeamMemberName(teamMemberById[a])

    const nameB = getTeamMemberName(teamMemberById[b])

    return nameA.localeCompare(nameB)
  })

  // --------------------------------------------
  // Dates (rows)
  // --------------------------------------------

  const dates = Array.from(
    new Set(
      filteredData.map(a =>
        DateTime.fromISO(String(a.date)).toFormat('yyyy/MM/dd'),
      ),
    ),
  ).sort()

  // --------------------------------------------
  // Assignment lookup
  // --------------------------------------------

  const assignmentMap = new Map<string, string>()

  for (const assignment of filteredData) {
    const date = DateTime.fromISO(String(assignment.date)).toFormat(
      'yyyy/MM/dd',
    )

    const shiftName = getShiftTypeName(shiftTypeById[assignment.shiftTypeId])

    assignmentMap.set(`${date}-${assignment.teamMemberId}`, shiftName)
  }

  // --------------------------------------------
  // CSV headers
  // --------------------------------------------

  const headers = [
    'Date',

    ...teamMemberIds.map(id => getTeamMemberName(teamMemberById[id])),
  ]

  // --------------------------------------------
  // CSV rows
  // --------------------------------------------

  const rows = dates.map(date => [
    date,

    ...teamMemberIds.map(teamMemberId => {
      return assignmentMap.get(`${date}-${teamMemberId}`) ?? ''
    }),
  ])

  // --------------------------------------------
  // Build CSV
  // --------------------------------------------

  return [
    headers.map(escapeCSV).join(','),

    ...rows.map(row => row.map(value => escapeCSV(String(value))).join(',')),
  ].join('\n')
}
