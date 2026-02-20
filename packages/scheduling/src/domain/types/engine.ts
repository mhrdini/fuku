import { ProposedAssignment, StaffingRequirement } from './schedule'
import { TeamSnapshot } from './team'

export interface SchedulerContext extends TeamSnapshot {
  staffingRequirement: StaffingRequirement
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
