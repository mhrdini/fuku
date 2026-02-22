import { DateTime } from 'luxon'

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
  dayOfWeek: number // 0 = Monday, 6 = Sunday
  startTime: string
  endTime: string
}

export type ZonedOperationalHours = {
  [dayOfWeek: number]: {
    startTime: DateTime
    endTime: DateTime
  }
}

export interface Assignment {
  teamMemberId: string
  shiftTypeId: string | null
  date: Date
}

export type ZonedAssignment = Zoned<Assignment, 'date'>

export interface Unavailability {
  teamMemberId: string
  date: Date
}

export type ZonedUnavailability = Zoned<Unavailability, 'date'>
