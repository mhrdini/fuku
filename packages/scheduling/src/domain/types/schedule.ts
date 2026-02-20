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

export interface Assignment {
  date: Date
  teamMemberId: string
}

export interface ProposedAssignment {
  date: Date
  memberId: string
  shiftTypeId: string
  score: number
  // constraintSummary: ConstraintEvaluation[] // idea
}

export interface Unavailability {
  teamMemberId: string
  date: Date
}
