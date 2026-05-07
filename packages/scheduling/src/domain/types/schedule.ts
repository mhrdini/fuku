import { ISODateString } from '@fuku/domain/schemas'

export interface PayGrade {
  id: string
  baseRate: number
}

export interface StaffingRequirement {
  weekday: number // 1 = Monday, 7 = Sunday
  minMembers: number
  maxMembers: number
}

export interface StaffingRequirements {
  [weekday: number]: {
    minMembers: number
    maxMembers: number
  }
}

export interface ShiftType {
  id: string
  startTime: string // HH:mm
  endTime: string
  allowedWeekdays: number[] // array of integers representing allowed days (1 = Monday, 7 = Sunday)
}

export interface PayGradeShiftType {
  payGradeId: string
  shiftTypeId: string
}

export interface OperationalHour {
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

export interface Assignment {
  teamMemberId: string
  shiftTypeId: string | null
  date: ISODateString
  score?: number
}

export interface Unavailability {
  teamMemberId: string
  date: ISODateString
}

export interface Holiday {
  date: ISODateString
}
