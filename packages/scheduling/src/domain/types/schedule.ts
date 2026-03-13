import { DateTime } from 'luxon'

import { Zoned } from '../../shared/utils/date'

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
  startTime: string
  endTime: string
  allowedWeekdays: number[] // array of integers representing allowed days (1 = Monday, 7 = Sunday)
}

export interface PayGradeShiftType {
  payGradeId: string
  shiftTypeId: string
}

export type ZonedShiftType = Zoned<ShiftType, 'startTime' | 'endTime'>

export interface OperationalHour {
  weekday: number // 1 = Monday, 7 = Sunday
  startTime: string
  endTime: string
}

export type ZonedOperationalHours = {
  [weekday: number]: {
    startTime: DateTime
    endTime: DateTime
  }
}

export interface Assignment {
  teamMemberId: string
  shiftTypeId: string | null
  date: Date
  score?: number
}

export type ZonedAssignment = Zoned<Assignment, 'date'>

export interface Unavailability {
  teamMemberId: string
  date: Date
}

export type ZonedUnavailability = Zoned<Unavailability, 'date'>
