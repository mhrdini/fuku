import { ShiftTypeOutput, TeamMemberOutput } from '@fuku/api/schemas'
import { SchedulerAssignment } from '@fuku/domain/schemas'
import { DateTime } from 'luxon'

import { getShiftTypeName } from './shift-types'
import { getTeamMemberName } from './team-member'

function escapeCSV(value: string): string {
  // Escape quotes
  const escaped = value.replace(/"/g, '""')

  // Wrap in quotes to safely support:
  // commas
  // Japanese text
  // line breaks
  return `"${escaped}"`
}

export function convertToCSV(
  data: SchedulerAssignment[],
  teamMemberById: Record<string, TeamMemberOutput>,
  shiftTypeById: Record<string, ShiftTypeOutput>,
): string {
  // --------------------------------------------
  // Team members (columns)
  // --------------------------------------------

  const teamMemberIds = Array.from(new Set(data.map(a => a.teamMemberId)))

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
      data.map(a => DateTime.fromISO(String(a.date)).toFormat('yyyy/MM/dd')),
    ),
  ).sort()

  // --------------------------------------------
  // Assignment lookup
  // --------------------------------------------

  const assignmentMap = new Map<string, string>()

  for (const assignment of data) {
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
