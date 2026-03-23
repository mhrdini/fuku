import {
  GenerateScheduleInput,
  GenerateScheduleOutput,
  SchedulerAssignment,
} from '@fuku/domain/schemas'
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
  StaffingRequirements,
  ZonedOperationalHours,
} from '../../domain/types/schedule'
import {
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
  generate(
    input: GenerateScheduleInput,
    options?: GenerateScheduleOptions,
  ): Promise<GenerateScheduleOutput>
}

export interface GenerateScheduleOptions {
  mode?: SchedulerMode
}
export class DefaultSchedulerService implements SchedulerService {
  schedulerEngine: SchedulerEngine = new DefaultSchedulerEngine()
  mode: SchedulerMode = 'dry-run'

  constructor(
    private teamRepository: TeamRepository,
    mode: SchedulerMode = 'dry-run',
  ) {
    if (mode) {
      this.mode = mode
    }
  }
  async generate(
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
      period: {
        start: toJSDate(context.period.start),
        end: toJSDate(context.period.end),
        timeZone: context.period.timeZone,
      },
      // assignments: [],
      assignments: engineResult.proposedAssignments.map(
        this.toSchedulerAssignment,
      ),
    }

    if (this.mode === 'replace') {
      await this.teamRepository.persistSchedule(
        serviceResult.teamId,
        serviceResult.period,
        serviceResult.assignments,
      )
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
    // UTC start and end (no timezone at all)
    const period = {
      start: input.start,
      end: input.end,
      timeZone: input.timeZone,
    }

    const snapshot = await this.teamRepository.getTeamSnapshot(
      input.teamId,
      period,
      {
        assignments: input.assignments
          ? input.assignments.map(a => ({
              teamMemberId: a.teamMemberId,
              shiftTypeId: a.shiftTypeId,
              date: a.date,
            }))
          : [],
        unavailabilities: input.unavailabilities
          ? input.unavailabilities.map(u => ({
              teamMemberId: u.teamMemberId,
              date: u.date,
            }))
          : [],
      },
    )

    return this.toSchedulerContext(snapshot)
  }

  /**
   * Convert all JS dates and HH:mm strings into Luxon DateTime in team timezone
   */
  private toSchedulerContext(snapshot: TeamSnapshot): SchedulerContext {
    const timeZone = snapshot.period.timeZone

    const shiftTypes = snapshot.shiftTypes.map(st => ({
      id: st.id,
      startTime: parseTimeString(st.startTime, timeZone),
      endTime: parseTimeString(st.endTime, timeZone),
      allowedWeekdays: st.allowedWeekdays.map(d => d as WeekdayNumbers),
    }))

    for (const rule of snapshot.rules) {
      if (!rule.shiftTypeId) continue

      const shiftType = shiftTypes.find(st => st.id === rule.shiftTypeId)
      if (!shiftType || !shiftType.allowedWeekdays?.length) continue

      const allowed = new Set<number>(shiftType.allowedWeekdays as number[])

      // find existing WEEKDAY IN condition
      const existing = rule.ruleConditions.find(
        c => c.field === 'WEEKDAY' && c.operator === 'IN',
      )

      if (!existing) {
        // no condition → just add it
        rule.ruleConditions.push({
          field: 'WEEKDAY',
          operator: 'IN',
          value: [...allowed],
        })

        // console.log(`\nCREATED CONDITION FOR RULE ${shiftType.id}`)
        // console.log(`\nALLOWED WEEKDAYS ${shiftType.allowedWeekdays}`)
        // console.log(
        //   `\nCONDITION: ${{
        //     field: 'WEEKDAY',
        //     operator: 'IN',
        //     value: [...allowed],
        //   }}`,
        // )
        continue
      }

      // normalize existing values
      const existingSet = new Set<number>(existing.value as number[])

      // check if sets are equal
      const isSame =
        existingSet.size === allowed.size &&
        [...allowed].every(v => existingSet.has(v))

      if (isSame) continue

      // if not, only get the allowed weekdays as the condition value
      const intersection = [...existingSet].filter(v => allowed.has(v))

      existing.value = intersection

      // console.log(`\nUPDATED CONDITION FOR RULE ${shiftType.id}`)
      // console.log(`\nALLOWED WEEKDAYS ${shiftType.allowedWeekdays}`)
      // console.log(`\nCONDITION: ${existing}`)
    }

    return {
      ...snapshot,

      shiftTypes,

      operationalHours: snapshot.operationalHours.reduce((acc, oh) => {
        acc[oh.weekday] = {
          startTime: parseTimeString(
            oh.startTime,
            timeZone,
            oh.weekday as WeekdayNumbers,
          ),
          endTime: parseTimeString(
            oh.endTime,
            timeZone,
            oh.weekday as WeekdayNumbers,
          ),
        }
        return acc
      }, {} as ZonedOperationalHours),

      staffingRequirements: snapshot.staffingRequirements.reduce((acc, sr) => {
        acc[sr.weekday] = {
          minMembers: sr.minMembers,
          maxMembers: sr.maxMembers,
        }
        return acc
      }, {} as StaffingRequirements),

      unavailabilities: snapshot.unavailabilities.map(u => ({
        teamMemberId: u.teamMemberId,
        date: toZonedDateTime(u.date, timeZone).startOf('day'),
      })),

      assignments: snapshot.assignments.map(a => ({
        teamMemberId: a.teamMemberId,
        shiftTypeId: a.shiftTypeId,
        date: toZonedDateTime(a.date, timeZone).startOf('day'),
      })),

      period: {
        ...toZonedPeriod(snapshot.period),
        start: toZonedPeriod(snapshot.period).start.startOf('day'),
        end: toZonedPeriod(snapshot.period).end.startOf('day'),
      },
    }
  }

  private toSchedulerAssignment(pa: ProposedAssignment): SchedulerAssignment {
    return {
      id: crypto.randomUUID(),
      teamMemberId: pa.teamMemberId,
      shiftTypeId: pa.shiftTypeId,
      date: toJSDate(pa.date),
      ...(pa.score !== undefined ? { score: pa.score } : {}),
    }
  }
}
