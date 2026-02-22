import { Period } from '../../shared/utils/date'
import {
  Assignment,
  OperationalHour,
  PayGrade,
  PayGradeShiftType,
  ShiftType,
  Unavailability,
} from './schedule'

export interface Team {
  id: string
}

export interface TeamMember {
  id: string
  payGradeId: string | null
}

export interface TeamSnapshot {
  team: Team
  teamMembers: TeamMember[]
  payGrades: PayGrade[]
  shiftTypes: ShiftType[]
  payGradeShiftTypes: PayGradeShiftType[]
  operationalHours: OperationalHour[]
  unavailabilities: Unavailability[]
  assignments: Assignment[]
  period: Period
}
