
import { ISODateString, ZonedPeriod } from '../../shared/utils/date'
import {
  StaffingRequirement,
  ZonedAssignment,
  ZonedOperationalHour,
  ZonedShiftType,
  ZonedUnavailability,
} from './schedule'
import { TeamSnapshot } from './team'

export interface SchedulerContext extends TeamSnapshot {
  staffingRequirement: StaffingRequirement
}

export interface ZonedSchedulerContext
  extends Omit<
    SchedulerContext,
    | 'shiftTypes'
    | 'operationalHours'
    | 'unavailabilities'
    | 'assignments'
    | 'period'
  > {
  shiftTypes: ZonedShiftType[]
  operationalHours: ZonedOperationalHour[]
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
  totalShiftsRequired: number
  totalShiftsAssigned: number
  totalUnavailabilitiesOverridden: number
  averageHoursPerMember: number
}

export interface ShiftSlot {
  date: ISODateString
  shiftTypeId: string
  assignedCandidate?: Candidate
}

export interface Candidate {
  teamMemberId: string
  score: number
  eligibleShiftSlots: Set<string> // ShiftSlot.date:ShiftSlot.shiftTypeId  'e.g. '2024-01-01:morning'
  eligibleDays: Set<ISODateString>
  assignmentCount: number
}

export interface ProposedAssignment {
  date: Date
  memberId: string
  shiftTypeId: string
  score: number
  // constraintSummary: ConstraintEvaluation[] // idea
}
