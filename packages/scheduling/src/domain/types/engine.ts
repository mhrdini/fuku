import { DateTime } from 'luxon'

import { ZonedPeriod } from '../../shared/utils/date'
import { ConstraintEvaluation } from '../constraints'
import {
  StaffingRequirement,
  ZonedAssignment,
  ZonedOperationalHours,
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
  totalShiftsRequired: number
  totalShiftsAssigned: number
  totalUnavailabilitiesOverridden: number
  averageHoursPerMember: number
}

export interface Candidate {
  date: DateTime
  teamMemberId: string
  shiftTypeId: string
  hardConstraintsPassed?: boolean
  score?: number
  evaluations?: ConstraintEvaluation[]
}

export interface ProposedAssignment {
  date: DateTime
  teamMemberId: string
  shiftTypeId: string
  score: number
  constraintSummary: ConstraintEvaluation[] // idea
}
