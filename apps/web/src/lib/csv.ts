import { ShiftTypeOutput, TeamMemberOutput } from '@fuku/api/schemas'
import { SchedulerAssignment } from '@fuku/domain/schemas'
import { DateTime } from 'luxon'

import { getShiftTypeName } from './shift-types'
import { getTeamMemberName } from './team-member'

const HEADER_NAME_MAP: Record<string, string> = {
  id: 'ID',
  teamMemberId: 'Name',
  shiftTypeId: 'Shift',
  date: 'Date',
}

export function convertToCSV(
  data: SchedulerAssignment[],
  teamMemberById: Record<string, TeamMemberOutput>,
  shiftTypeById: Record<string, ShiftTypeOutput>,
): string {
  const headers = ['id', 'date', 'teamMemberId', 'shiftTypeId']

  const sortedData = [...data].sort((a, b) => {
    // compare dates first
    const dateA = new Date(a.date).getTime()
    const dateB = new Date(b.date).getTime()

    if (dateA !== dateB) {
      return dateA - dateB // ascending
    }

    // if same date, compare teamMemberId
    return a.teamMemberId.localeCompare(b.teamMemberId)
  })

  const rows = sortedData.map((item, index) =>
    headers
      .map(header => {
        const value = item[header as keyof SchedulerAssignment]

        switch (header) {
          case 'teamMemberId':
            const tm = teamMemberById[value as string]
            return getTeamMemberName(tm)
          case 'shiftTypeId':
            const st = shiftTypeById[value as string]
            return getShiftTypeName(st)
          case 'date':
            // ISO string
            return DateTime.fromISO(value as string).toFormat('yyyy/MM/dd')
          default:
            return index
        }
      })
      .join(','),
  )

  return [
    headers.map(header => HEADER_NAME_MAP[header]).join(','),
    ...rows,
  ].join('\n')
}
