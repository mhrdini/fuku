import { Candidate, ProposedAssignment, ZonedSchedulerContext } from '../types'

export interface Constraint {
  name: string
  evaluate(
    candidate: Candidate,
    ctx: ZonedSchedulerContext,
    proposedAssignment: ProposedAssignment[],
  ): ConstraintEvaluation
}

export type ConstraintEvaluation = {
  constraintName: string
  isSatisfied: boolean
  weight: number // optional for priority/importance
}
