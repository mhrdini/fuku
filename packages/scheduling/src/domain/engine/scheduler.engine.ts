import Heap from 'heap-js'
import { DateTime, WeekdayNumbers } from 'luxon'

import {
  generateDateTimes,
  toZonedDateTime,
  toZonedPeriod,
} from '../../shared/utils/date'
import { ZonedOperationalHours } from '../types'
import {
  Candidate,
  ProposedAssignment,
  SchedulerContext,
  SchedulerResult,
  ZonedSchedulerContext,
} from '../types/engine'

export interface SchedulerEngine {
  run(context: SchedulerContext): Promise<SchedulerResult>
}

export class DefaultSchedulerEngine implements SchedulerEngine {
  async run(ctx: SchedulerContext): Promise<SchedulerResult> {
    // 1. Initialize the scheduling algorithm with the context
    // 2. Iteratively generate proposed assignments while evaluating constraints and optimizing for fairness and coverage
    // 3. Collect metrics on the scheduling process (e.g., total shifts assigned, unavailabilities overridden)
    // 4. Return the final proposed assignments along with metrics

    const zonedCtx = this.normaliseDates(ctx)

    // High-level algorithm outline:
    // Propose assignments = for each day in the period
    // Candidate generation = produce all possible member → shift pairings
    // Hard rules evaluation = filter out candidates violating any constraint
    // Soft rules scoring = compute a score for remaining candidates based on
    // optimization objectives
    // Candidate selection = pick the best candidates for each day, ensuring we meet
    // staffing requirements

    const proposedAssignments: ProposedAssignment[] = []
    const periodDates = generateDateTimes(zonedCtx.period)

    for (const date of periodDates) {
      const candidates: Candidate[] = []

      for (const tm of ctx.teamMembers) {
        for (const st of ctx.shiftTypes) {
          const candidate: Candidate = {
            date,
            teamMemberId: tm.id,
            shiftTypeId: st.id,
            score: 0,
            evaluations: [],
            hardConstraintsPassed: false,
          }

          // // Evaluate hard constraints
          // const evaluations = constraints.map(c => c.evaluate(candidate, ctx))
          // candidate.evaluations = evaluations
          // if (evaluations.every(e => e.isSatisfied)) {
          //   candidate.hardConstraintsPassed = true
          // } else {
          //   candidate.hardConstraintsPassed = false
          //   continue
          // }

          // // Compute soft rule score
          // candidate.score = scoringRules.reduce(
          //   (sum, rule) => sum + rule.score(candidate, ctx),
          //   0,
          // )

          candidates.push(candidate)
        }
      }

      const candidateHeap = new Heap<Candidate>(
        (a, b) => (b.score || 0) - (a.score || 0),
      )
      candidateHeap.init(candidates)

      for (let i = 0; i < ctx.staffingRequirement.minMembersPerDay; i++) {
        const best = candidateHeap.pop()
        if (!best) {
          break
        }
        proposedAssignments.push({
          teamMemberId: best.teamMemberId,
          date,
          shiftTypeId: best.shiftTypeId,
          score: best.score || 0,
          constraintSummary: best.evaluations || [],
        })
      }
    }

    return {
      success: false,
      proposedAssignments,
      metrics: {
        totalShiftsRequired: 0,
        totalShiftsAssigned: 0,
        totalUnavailabilitiesOverridden: 0,
        averageHoursPerMember: 0,
      },
    }
  }

  /**
   * Convert all JS dates and HH:mm strings into Luxon DateTime in team timezone
   */
  private normaliseDates(ctx: SchedulerContext): ZonedSchedulerContext {
    return {
      team: ctx.team,
      teamMembers: ctx.teamMembers,
      payGrades: ctx.payGrades,
      shiftTypes: ctx.shiftTypes.map(st => ({
        id: st.id,
        startTime: DateTime.fromObject(
          {
            hour: parseInt(st.startTime.split(':')[0]),
            minute: parseInt(st.startTime.split(':')[1]),
          },
          { zone: ctx.period.timeZone },
        ),
        endTime: DateTime.fromObject(
          {
            hour: parseInt(st.endTime.split(':')[0]),
            minute: parseInt(st.endTime.split(':')[1]),
          },
          {
            zone: ctx.period.timeZone,
          },
        ),
      })),
      operationalHours: ctx.operationalHours.reduce<ZonedOperationalHours>(
        (acc, oh) => ({
          ...acc,
          [oh.dayOfWeek]: {
            startTime: DateTime.fromObject(
              {
                weekday: oh.dayOfWeek as WeekdayNumbers,
                hour: parseInt(oh.startTime.split(':')[0]),
                minute: parseInt(oh.startTime.split(':')[1]),
              },
              {
                zone: ctx.period.timeZone,
              },
            ),
            endTime: DateTime.fromObject(
              {
                weekday: oh.dayOfWeek as WeekdayNumbers,
                hour: parseInt(oh.endTime.split(':')[0]),
                minute: parseInt(oh.endTime.split(':')[1]),
              },
              {
                zone: ctx.period.timeZone,
              },
            ),
          },
        }),
        {},
      ),
      unavailabilities: ctx.unavailabilities.map(u => ({
        teamMemberId: u.teamMemberId,
        date: toZonedDateTime(u.date, ctx.period.timeZone),
      })),
      assignments: ctx.assignments.map(a => ({
        teamMemberId: a.teamMemberId,
        shiftTypeId: a.shiftTypeId,
        date: toZonedDateTime(a.date, ctx.period.timeZone),
      })),
      staffingRequirement: ctx.staffingRequirement,
      period: toZonedPeriod(ctx.period),
    }
  }
}
