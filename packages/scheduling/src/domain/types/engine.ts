import { Rule } from '@fuku/domain/schemas'
import { DateTime } from 'luxon'

import { Period, ZonedPeriod } from '../../shared/utils/date'
import {
  Assignment,
  OperationalHour,
  PayGrade,
  PayGradeShiftType,
  ShiftType,
  StaffingRequirement,
  Unavailability,
  ZonedAssignment,
  ZonedOperationalHours,
  ZonedShiftType,
  ZonedUnavailability,
} from './schedule'
import { Team, TeamMember } from './team'

export interface TeamSnapshot {
  team: Team
  teamMembers: TeamMember[]
  payGrades: PayGrade[]
  shiftTypes: ShiftType[]
  payGradeShiftTypes: PayGradeShiftType[]
  payGradeRules: Rule[]
  operationalHours: OperationalHour[]
  unavailabilities: Unavailability[]
  assignments: Assignment[]
  period: Period
}

export interface SchedulerContext
  extends Omit<
    TeamSnapshot,
    | 'shiftTypes'
    | 'operationalHours'
    | 'unavailabilities'
    | 'assignments'
    | 'period'
  > {
  staffingRequirement: StaffingRequirement
  shiftTypes: ZonedShiftType[]
  operationalHours: ZonedOperationalHours
  unavailabilities: ZonedUnavailability[]
  assignments: ZonedAssignment[]
  period: ZonedPeriod
}

export interface SchedulerResult {
  success: boolean
  proposedAssignments: ProposedAssignment[]
  metrics: SchedulerMetrics
}

interface SchedulerMetrics {
  totalSlotsRequired: number
  totalSlotsFilled: number
  totalOperationalCoverage: number
  fairnessStdDeviation: number
  totalHardConstraintViolations: number
  totalSoftPenalty: number
}

export interface ProposedAssignment {
  date: DateTime
  teamMemberId: string
  shiftTypeId: string
}
