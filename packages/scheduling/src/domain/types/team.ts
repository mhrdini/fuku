import { Period } from '../../shared/utils/date'
import { Assignment, PayGrade, ShiftType, Unavailability } from './schedule'

export interface Team {
  id: string
}

export interface TeamMember {
  id: string
  payGradeId: string
  isActive: boolean
}

export interface TeamSnapshot {
  team: Team
  teamMembers: TeamMember[]
  payGrades: PayGrade[]
  shiftTypes: ShiftType[]
  unavailabilities: Unavailability[]
  assignments: Assignment[]
  period: Period
}
