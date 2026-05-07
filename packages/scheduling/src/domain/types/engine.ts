import {
  ISODateString,
  JsonValue,
  RuleConditionField,
  RuleConditionOperator,
  Rule as RuleType,
} from '@fuku/domain/schemas'

import { Period } from '../../shared/utils/date'
import {
  Assignment,
  OperationalHour,
  OperationalHours,
  PayGrade,
  PayGradeShiftType,
  ShiftType,
  StaffingRequirement,
  StaffingRequirements,
  Unavailability,
} from './schedule'
import { Team, TeamMember } from './team'

export interface RuleCondition {
  field: RuleConditionField
  operator: RuleConditionOperator
  value: JsonValue
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
  extends Omit<TeamSnapshot, 'operationalHours' | 'staffingRequirements'> {
  operationalHours: OperationalHours
  staffingRequirements: StaffingRequirements
  holidays: Set<ISODateString> // yyyy-MM-dd
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
  date: ISODateString
  teamMemberId: string
  shiftTypeId: string
  score?: number
}
