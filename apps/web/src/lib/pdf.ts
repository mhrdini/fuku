import { ShiftTypeOutput, TeamMemberOutput } from '@fuku/api/schemas'
import { SchedulerAssignment } from '@fuku/domain/schemas'
import { jsPDF } from 'jspdf'
import { autoTable } from 'jspdf-autotable'
import { DateTime } from 'luxon'

import { getShiftTypeName } from './shift-types'
import { getTeamMemberName } from './team-member'

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = ''

  const bytes = new Uint8Array(buffer)

  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }

  return btoa(binary)
}

export async function convertToPDF(
  data: SchedulerAssignment[],
  teamMemberById: Record<string, TeamMemberOutput>,
  shiftTypeById: Record<string, ShiftTypeOutput>,
  startDate: Date,
  endDate: Date,
) {
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
  // Table headers
  // --------------------------------------------

  const head = [
    ['Date', ...teamMemberIds.map(id => getTeamMemberName(teamMemberById[id]))],
  ]

  // --------------------------------------------
  // Table body
  // --------------------------------------------

  const body = dates.map(date => [
    date,

    ...teamMemberIds.map(teamMemberId => {
      return assignmentMap.get(`${date}-${teamMemberId}`) ?? ''
    }),
  ])

  // --------------------------------------------
  // Load font
  // --------------------------------------------

  const fontResponse = await fetch('/fonts/NotoSansJP-Regular.ttf')

  const fontBuffer = await fontResponse.arrayBuffer()

  const fontBase64 = arrayBufferToBase64(fontBuffer)

  // --------------------------------------------
  // Create PDF
  // --------------------------------------------

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  })

  // --------------------------------------------
  // Register font
  // --------------------------------------------

  doc.addFileToVFS('NotoSansJP-Regular.ttf', fontBase64)

  doc.addFileToVFS('NotoSansJP-Bold.ttf', fontBase64)

  doc.addFont('NotoSansJP-Regular.ttf', 'NotoSansJP', 'normal')

  doc.addFont('NotoSansJP-Bold.ttf', 'NotoSansJP', 'bold')

  doc.setFont('NotoSansJP')

  // --------------------------------------------
  // Title
  // --------------------------------------------

  doc.setFontSize(14)

  doc.text('Schedule Export', 14, 14)

  // --------------------------------------------
  // Table
  // --------------------------------------------

  autoTable(doc, {
    head,
    body,
    startY: 20,

    styles: {
      font: 'NotoSansJP',
      fontSize: 8,
      cellPadding: 2,
      overflow: 'linebreak',
      halign: 'center',
      valign: 'middle',
    },

    headStyles: {
      font: 'NotoSansJP',
      fontStyle: 'normal',
      fontSize: 8,
    },

    columnStyles: {
      0: {
        cellWidth: 28,
        fontStyle: 'bold',
      },
    },

    didParseCell: data => {
      const text = String(data.cell.raw ?? '')

      if (text === 'OFF') {
        data.cell.styles.textColor = [140, 140, 140]
      }
    },

    margin: {
      top: 10,
      left: 10,
      right: 10,
      bottom: 10,
    },
  })

  return doc
}
