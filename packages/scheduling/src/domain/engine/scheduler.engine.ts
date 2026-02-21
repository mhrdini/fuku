import { DateTime, WeekdayNumbers } from 'luxon'

import {
  generateDays,
  toZonedDateTime,
  toZonedPeriod,
} from '../../shared/utils/date'
import {
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
    const shiftSlots = this.generateShiftSlots(zonedCtx)

    return {
      success: false,
      proposedAssignments: [], // This would be the result of the scheduling algorithm
      metrics: {
        totalShiftsRequired: 0,
        totalShiftsAssigned: 0,
        totalUnavailabilitiesOverridden: 0,
        averageHoursPerMember: 0,
      },
    }
  }

  private generateShiftSlots(ctx: ZonedSchedulerContext) {
    const days = generateDays(ctx.period)
    // TODO: For each day, determine the required shift types based on operational hours and staffing requirements
  }

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
      operationalHours: ctx.operationalHours.map(oh => ({
        dayOfWeek: oh.dayOfWeek,
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
      })),
      unavailabilities: ctx.unavailabilities.map(u => ({
        teamMemberId: u.teamMemberId,
        date: toZonedDateTime(u.date, ctx.period.timeZone),
      })),
      assignments: ctx.assignments.map(a => ({
        teamMemberId: a.teamMemberId,
        date: toZonedDateTime(a.date, ctx.period.timeZone),
      })),
      staffingRequirement: ctx.staffingRequirement,
      period: toZonedPeriod(ctx.period),
    }
  }
}
