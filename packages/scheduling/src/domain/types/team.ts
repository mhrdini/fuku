import { Period } from '../../shared/utils/date'
import {
  Assignment,
  OperationalHour,
  PayGrade,
  ShiftType,
  Unavailability,
} from './schedule'

export interface Team {
  id: string
}

export interface TeamMember {
  id: string
  payGradeId: string | null
  isActive: boolean
}

export interface TeamSnapshot {
  team: Team
  teamMembers: TeamMember[]
  payGrades: PayGrade[]
  shiftTypes: ShiftType[]
  operationalHours: OperationalHour[]
  unavailabilities: Unavailability[]
  assignments: Assignment[]
  period: Period
}
