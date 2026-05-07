import {
  addDays,
  getDaysBetweenInclusive,
  getDaysDifference,
} from '../../shared/utils/date'
import {
  ProposedAssignment,
  SchedulerContext,
  SchedulerMetrics,
  SchedulerResult,
} from '../types'
import { SolverResult } from './solver.adapter'

export class SolutionMapper {
  private totalDays: number

  constructor(
    private readonly ctx: SchedulerContext,
    private readonly solverResult: SolverResult,
  ) {
    this.totalDays = getDaysBetweenInclusive(ctx.period.start, ctx.period.end)
  }

  getResult(): SchedulerResult {
    if (!this.solverResult.values) {
      return {
        success: false,
        proposedAssignments: [],
        metrics: this.emptyMetrics(),
      }
    }

    const proposedAssignments: ProposedAssignment[] = []

    for (const [varName, value] of Object.entries(this.solverResult.values)) {
      if (!varName.startsWith('assign__')) continue
      if (value !== 1) continue

      const [, teamMemberId, dayIndexStr, shiftTypeId] = varName.split('__')

      const dayIndex = parseInt(dayIndexStr, 10)

      proposedAssignments.push({
        date: addDays(this.ctx.period.start, dayIndex),
        teamMemberId,
        shiftTypeId,
      })
    }

    const metrics = this.computeMetrics(proposedAssignments)

    return {
      success: true,
      proposedAssignments,
      metrics,
    }
  }

  private computeMetrics(assignments: ProposedAssignment[]): SchedulerMetrics {
    const totalSlotsRequired = this.totalDays * this.ctx.shiftTypes.length

    const totalSlotsFilled = assignments.length

    // coverage
    const coveragePerDay: number[] = Array(this.totalDays).fill(0)

    for (const assignment of assignments) {
      const dayIndex = getDaysDifference(this.ctx.period.start, assignment.date)

      coveragePerDay[dayIndex]++
    }

    const coveredDays = coveragePerDay.filter(v => v > 0).length

    const totalOperationalCoverage = coveredDays / this.totalDays

    // fairness
    const slotsPerMember: Record<string, number> = {}

    const teamMemberIds = this.ctx.teamMembers.map(tm => tm.id)

    for (const id of teamMemberIds) {
      slotsPerMember[id] = 0
    }

    for (const assignment of assignments) {
      slotsPerMember[assignment.teamMemberId]++
    }

    const mean = totalSlotsFilled / teamMemberIds.length

    const variance =
      teamMemberIds.reduce((acc, id) => {
        return acc + Math.pow(slotsPerMember[id] - mean, 2)
      }, 0) / teamMemberIds.length

    const fairnessStdDeviation = Math.sqrt(variance)

    const totalHardConstraintViolations = 0

    const totalSoftPenalty = this.solverResult.objectiveValue ?? 0

    return {
      totalSlotsRequired,
      totalSlotsFilled,
      totalOperationalCoverage,
      fairnessStdDeviation,
      totalHardConstraintViolations,
      totalSoftPenalty,
    }
  }

  private emptyMetrics(): SchedulerMetrics {
    return {
      totalSlotsRequired: 0,
      totalSlotsFilled: 0,
      totalOperationalCoverage: 0,
      fairnessStdDeviation: 0,
      totalHardConstraintViolations: 0,
      totalSoftPenalty: 0,
    }
  }
}
