import { WeekdayNumbers } from 'luxon'

import {
  DefaultSchedulerEngine,
  SchedulerEngine,
} from '../../domain/engine/scheduler.engine'
import {
  ProposedAssignment,
  SchedulerContext,
  TeamSnapshot,
} from '../../domain/types/engine'
import {
  Assignment,
  StaffingRequirement,
  ZonedOperationalHours,
} from '../../domain/types/schedule'
import {
  getPeriod,
  parseTimeString,
  toJSDate,
  toZonedDateTime,
  toZonedPeriod,
} from '../../shared/utils/date'
import { TeamRepository } from '../ports/team.repository'

export type SchedulerMode =
  | 'dry-run' // without persisting to db
  | 'replace' // persist to db, replacing existing assignments for the period
export interface SchedulerService {
  mode: SchedulerMode
  generateMonthly(
    input: GenerateScheduleInput,
    options?: GenerateScheduleOptions,
  ): Promise<GenerateScheduleOutput>
}

export interface GenerateScheduleInput {
  teamId: string
  year: number
  month: number
  timeZone: string
}

export interface GenerateScheduleOptions {
  mode?: SchedulerMode
}

export interface GenerateScheduleOutput {
  teamId: string
  year: number
  month: number
  assignments: Assignment[]
}

export class DefaultSchedulerService implements SchedulerService {
  constructor(private teamRepository: TeamRepository) {}

  schedulerEngine: SchedulerEngine = new DefaultSchedulerEngine()
  mode: SchedulerMode = 'dry-run'

  async generateMonthly(
    input: GenerateScheduleInput,
    options?: GenerateScheduleOptions,
  ): Promise<GenerateScheduleOutput> {
    // 1. Fetch necessary data (team, members, pay grades, shift types, unavailabilities, existing assignments, staffing requirements)
    // 2. Build SchedulerContext
    // 3. Invoke SchedulerEngine with the context
    // 4. If mode is 'commit', persist the proposed assignments to the database
    // 5. Return the generated schedule

    if (options) this.setOptions(options)

    const context = await this.buildContext(input)

    const engineResult = await this.schedulerEngine.run(context)

    const serviceResult = {
      teamId: input.teamId,
      year: input.year,
      month: input.month,
      assignments: engineResult.proposedAssignments.map(this.toAssignment),
    }

    return serviceResult
  }

  private setOptions(options: GenerateScheduleOptions) {
    if (options.mode) {
      this.mode = options.mode
    }
  }

  private async buildContext(
    input: GenerateScheduleInput,
  ): Promise<SchedulerContext> {
    const period = getPeriod(input.year, input.month, input.timeZone)

    const staffingRequirement: StaffingRequirement = {
      minMembersPerDay: 4, // TODO: make dynamic
    }

    const snapshot = await this.teamRepository.getTeamSnapshot(
      input.teamId,
      period,
    )

    return this.toSchedulerContext(snapshot, staffingRequirement)
  }

  /**
   * Convert all JS dates and HH:mm strings into Luxon DateTime in team timezone
   */
  private toSchedulerContext(
    snapshot: TeamSnapshot,
    staffingRequirement: StaffingRequirement,
  ): SchedulerContext {
    const timeZone = snapshot.period.timeZone

    return {
      ...snapshot,
      staffingRequirement,

      shiftTypes: snapshot.shiftTypes.map(st => ({
        id: st.id,
        startTime: parseTimeString(st.startTime, timeZone),
        endTime: parseTimeString(st.endTime, timeZone),
      })),

      operationalHours: snapshot.operationalHours.reduce((acc, oh) => {
        acc[oh.dayOfWeek] = {
          startTime: parseTimeString(
            oh.startTime,
            timeZone,
            oh.dayOfWeek as WeekdayNumbers,
          ),
          endTime: parseTimeString(
            oh.endTime,
            timeZone,
            oh.dayOfWeek as WeekdayNumbers,
          ),
        }
        return acc
      }, {} as ZonedOperationalHours),

      unavailabilities: snapshot.unavailabilities.map(u => ({
        teamMemberId: u.teamMemberId,
        date: toZonedDateTime(u.date, timeZone),
      })),

      assignments: snapshot.assignments.map(a => ({
        teamMemberId: a.teamMemberId,
        shiftTypeId: a.shiftTypeId,
        date: toZonedDateTime(a.date, timeZone),
      })),

      period: toZonedPeriod(snapshot.period),
    }
  }

  private toAssignment(pa: ProposedAssignment): Assignment {
    return {
      teamMemberId: pa.teamMemberId,
      shiftTypeId: pa.shiftTypeId,
      date: toJSDate(pa.date),
    }
  }
}
