import { Constraint, ConstraintEvaluation } from '.'
import { Candidate, ProposedAssignment, ZonedSchedulerContext } from '../types'

export class NoOverlapConstraint implements Constraint {
  name = 'NoOverlap'

  evaluate(
    candidate: Candidate,
    ctx: ZonedSchedulerContext,
    proposedAssignments: ProposedAssignment[],
  ): ConstraintEvaluation {
    const overlap = proposedAssignments.some(
      pa =>
        pa.teamMemberId === candidate.teamMemberId &&
        pa.date.hasSame(candidate.date, 'day') &&
        pa.shiftTypeId === candidate.shiftTypeId, // could use segment overlap check too
    )

    return {
      constraintName: this.name,
      isSatisfied: !overlap,
      weight: 1,
    }
  }
}
