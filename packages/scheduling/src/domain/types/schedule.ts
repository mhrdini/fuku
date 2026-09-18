import type { ISODateString } from '@fuku/domain/schemas'

export type PayGrade = {
  id: string
  baseRate: number
}

export type StaffingRequirement = {
  weekday: number // 1 = Monday, 7 = Sunday
  minMembers: number
  maxMembers: number
}

export type StaffingRequirements = {
  [weekday: number]: {
    minMembers: number
    maxMembers: number
  }
}

export type ShiftType = {
  id: string
  startTime: string // HH:mm
  endTime: string
  allowedWeekdays: number[] // array of integers representing allowed days (1 = Monday, 7 = Sunday)
}

export type PayGradeShiftType = {
  payGradeId: string
  shiftTypeId: string
}

export type OperationalHour = {
  weekday: number // 1 = Monday, 7 = Sunday
  startTime: string
  endTime: string
}

export type OperationalHours = {
  [weekday: number]: {
    startTime: string
    endTime: string
  }
}

export type Assignment = {
  teamMemberId: string
  shiftTypeId: string | null
  date: ISODateString
  score?: number
}

export type Unavailability = {
  teamMemberId: string
  date: ISODateString
}

export type Holiday = {
  date: ISODateString
}
