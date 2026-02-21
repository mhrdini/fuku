import { Zoned } from '../../shared/utils/date'

export interface PayGrade {
  id: string
  baseRate: number
}

export interface StaffingRequirement {
  minMembersPerDay: number
}

export interface ShiftType {
  id: string
  startTime: string
  endTime: string
}

export type ZonedShiftType = Zoned<ShiftType, 'startTime' | 'endTime'>

export interface OperationalHour {
  dayOfWeek: number // 1 = Monday, 7 = Sunday
  startTime: string // HH:mm format
  endTime: string
}

export type ZonedOperationalHour = Zoned<
  OperationalHour,
  'startTime' | 'endTime'
>

export interface Assignment {
  teamMemberId: string
  date: Date
}

export type ZonedAssignment = Zoned<Assignment, 'date'>

export interface Unavailability {
  teamMemberId: string
  date: Date
}

export type ZonedUnavailability = Zoned<Unavailability, 'date'>
