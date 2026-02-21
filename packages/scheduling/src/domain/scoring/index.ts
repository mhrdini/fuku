import { Candidate, ProposedAssignment, ZonedSchedulerContext } from '../types'

export interface ScoringRule {
  name: string
  weight: number
  score(
    candidate: Candidate,
    ctx: ZonedSchedulerContext,
    proposedAssignments: ProposedAssignment[],
  ): number
}
