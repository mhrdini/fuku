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
    this.totalDays =
      ctx.period.end
        .startOf('day')
        .diff(ctx.period.start.startOf('day'), 'days')
        .as('days') + 1
  }

  getResult(): SchedulerResult {
    if (!this.solverResult.values) {
      return {
        success: false,
        proposedAssignments: [],
        metrics: this.emptyMetrics(),
      }
    }

    // extract assignments
    const proposedAssignments: ProposedAssignment[] = []

    for (const [varName, value] of Object.entries(this.solverResult.values)) {
      if (!varName.startsWith('assign__')) continue

      if (value !== 1) continue // only consider assigned slots

      const [, teamMemberId, dayIndexStr, shiftTypeId] = varName.split('__')
      const dayIndex = parseInt(dayIndexStr, 10)
      proposedAssignments.push({
        date: this.ctx.period.start.plus({ days: dayIndex }),
        teamMemberId,
        shiftTypeId,
      })
    }

    // compute metrics
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
    for (const a of assignments) {
      const dayIndex = a.date.diff(this.ctx.period.start).as('days')
      coveragePerDay[dayIndex]++
    }

    const totalOperationalCoverage =
      coveragePerDay.reduce((acc, v) => acc + (v > 0 ? 1 : 0), 0) /
      this.totalDays

    // fairness: standard deviation of slots per member
    const slotsPerMember: Record<string, number> = {}
    const teamMemberIds = this.ctx.teamMembers.map(tm => tm.id)
    for (const id of teamMemberIds) slotsPerMember[id] = 0
    for (const a of assignments) slotsPerMember[a.teamMemberId]++
    const mean = totalSlotsFilled / teamMemberIds.length
    const variance =
      teamMemberIds.reduce(
        (acc, id) => acc + Math.pow(slotsPerMember[id] - mean, 2),
        0,
      ) / teamMemberIds.length
    const fairnessStdDeviation = Math.sqrt(variance)

    // hard constraint violations placeholder
    const totalHardConstraintViolations = 0

    // soft penalty placeholder (sum of objective function penalties if relevant)
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
