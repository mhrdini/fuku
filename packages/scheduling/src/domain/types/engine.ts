import {
  RuleConditionField,
  RuleConditionOperator,
  Rule as RuleType,
} from '@fuku/domain/schemas'
import { DateTime } from 'luxon'

import { Period, ZonedPeriod } from '../../shared/utils/date'
import {
  Assignment,
  OperationalHour,
  PayGrade,
  PayGradeShiftType,
  ShiftType,
  StaffingRequirement,
  StaffingRequirements,
  Unavailability,
  ZonedAssignment,
  ZonedOperationalHours,
  ZonedShiftType,
  ZonedUnavailability,
} from './schedule'
import { Team, TeamMember } from './team'

export interface RuleCondition {
  field: RuleConditionField
  operator: RuleConditionOperator
  value: string | number | boolean | object | string[] | number[] | null
}
export interface Rule
  extends Omit<
    RuleType,
    'payGradeId' | 'shiftTypeId' | 'teamMemberId' | 'penalty'
  > {
  payGradeId: string | null
  shiftTypeId: string | null
  teamMemberId: string | null
  penalty: number | null
  ruleConditions: RuleCondition[]
}

export interface TeamSnapshot {
  team: Team
  teamMembers: TeamMember[]
  payGrades: PayGrade[]
  shiftTypes: ShiftType[]
  payGradeShiftTypes: PayGradeShiftType[]
  rules: Rule[]
  staffingRequirements: StaffingRequirement[]
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
    | 'staffingRequirements'
    | 'unavailabilities'
    | 'assignments'
    | 'period'
  > {
  shiftTypes: ZonedShiftType[]
  operationalHours: ZonedOperationalHours
  staffingRequirements: StaffingRequirements
  unavailabilities: ZonedUnavailability[]
  assignments: ZonedAssignment[]
  period: ZonedPeriod
}

export interface SchedulerResult {
  success: boolean
  proposedAssignments: ProposedAssignment[]
  metrics: SchedulerMetrics
}

export interface SchedulerMetrics {
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
  score?: number
}
