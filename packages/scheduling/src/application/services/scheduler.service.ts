import {
  DefaultSchedulerEngine,
  SchedulerEngine,
} from '../../domain/engine/scheduler.engine'
import { SchedulerContext } from '../../domain/types/engine'
import { Assignment } from '../../domain/types/schedule'
import { getPeriod, toJSDate } from '../../shared/utils/date'
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
  constructor(
    private schedulerEngine: SchedulerEngine = new DefaultSchedulerEngine(),
    private teamRepository: TeamRepository,
  ) {}

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
      assignments: engineResult.proposedAssignments.map(pa => ({
        date: toJSDate(pa.date),
        teamMemberId: pa.teamMemberId,
        shiftTypeId: pa.shiftTypeId,
      })),
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
    // Fetch data from repositories (e.g. TeamRepository) and construct the SchedulerContext

    // Engine expects period in team timezone
    const period = getPeriod(input.year, input.month, input.timeZone)
    // console.log('Generated period for scheduling:', period)

    const staffingRequirement = {
      minMembersPerDay: 3, // TODO: implement dynamic staffing requirements
    }
    const teamSnapshot = await this.teamRepository.getTeamSnapshot(
      input.teamId,
      period,
    )
    return {
      ...teamSnapshot,
      staffingRequirement,
    }
  }
}
