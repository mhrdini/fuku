import {
  DefaultSchedulerEngine,
  SchedulerEngine,
} from '../../domain/engine/scheduler.engine'
import { SchedulerContext } from '../../domain/types/engine'
import { Assignment } from '../../domain/types/schedule'
import { getPeriod } from '../../shared/utils/date'
import { TeamRepository } from '../ports/team.repository'

type SchedulerMode = 'dry-run' | 'commit'
export interface SchedulerService {
  mode: SchedulerMode
  generateMonthly(input: GenerateScheduleInput): Promise<GenerateScheduleOutput>
}

export interface GenerateScheduleInput {
  teamId: string
  year: number
  month: number
  timeZone: string
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
  ): Promise<GenerateScheduleOutput> {
    // 1. Fetch necessary data (team, members, pay grades, shift types, unavailabilities, existing assignments, staffing requirements)
    // 2. Build SchedulerContext
    // 3. Invoke SchedulerEngine with the context
    // 4. If mode is 'commit', persist the proposed assignments to the database
    // 5. Return the generated schedule

    const context = await this.buildContext(input)
    const engineResult = await this.schedulerEngine.run(context)
    const serviceResult = {
      teamId: input.teamId,
      year: input.year,
      month: input.month,
      assignments: engineResult.proposedAssignments.map(pa => ({
        date: pa.date,
        teamMemberId: pa.memberId,
        shiftTypeId: pa.shiftTypeId,
      })),
    }
    return serviceResult
  }

  private async buildContext(
    input: GenerateScheduleInput,
  ): Promise<SchedulerContext> {
    // Fetch data from repositories (e.g. TeamRepository) and construct the SchedulerContext
    //

    // UTC for db queries to avoid DST issues - the scheduling engine should handle time zones when generating the schedule
    const period = getPeriod(input.year, input.month, 'UTC')
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
