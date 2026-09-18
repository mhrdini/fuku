import type { Period } from '../../shared/utils/date'
import type {
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
import type { Team, TeamMember } from './team'
import type {
  ISODateString,
  JsonValue,
  RuleConditionField,
  RuleConditionOperator,
  Rule as RuleType,
} from '@fuku/domain/schemas'

export type RuleCondition = {
  field: RuleConditionField
  operator: RuleConditionOperator
  value: JsonValue
}
export type Rule = {
  payGradeId: string | null
  shiftTypeId: string | null
  teamMemberId: string | null
  penalty: number | null
  ruleConditions: RuleCondition[]
} & Omit<
  RuleType,
    'payGradeId' | 'shiftTypeId' | 'teamMemberId' | 'penalty'
>

export type TeamSnapshot = {
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

export type SchedulerContext = {
  operationalHours: OperationalHours
  staffingRequirements: StaffingRequirements
  holidays: Set<ISODateString> // yyyy-MM-dd
} & Omit<TeamSnapshot, 'operationalHours' | 'staffingRequirements'>

export type SchedulerResult = {
  success: boolean
  proposedAssignments: ProposedAssignment[]
  metrics: SchedulerMetrics
}

export type SchedulerMetrics = {
  totalSlotsRequired: number
  totalSlotsFilled: number
  totalOperationalCoverage: number
  fairnessStdDeviation: number
  totalHardConstraintViolations: number
  totalSoftPenalty: number
}

export type ProposedAssignment = {
  date: ISODateString
  teamMemberId: string
  shiftTypeId: string
  score?: number
}
