import type {
  GenerateScheduleInput,
  GenerateScheduleOutput,
} from '@fuku/domain/schemas'
import type {
  GenerateScheduleOptions,
  SchedulerMode,
  SchedulerService,
} from '@fuku/scheduling'

// creates configurable test scheduler service
export function createTestSchedulerService(
  overrides: Partial<SchedulerService> = {},
): SchedulerService {
  return {
    mode: 'dry-run' satisfies SchedulerMode,

    generate: async (
      input: GenerateScheduleInput,
      _options?: GenerateScheduleOptions,
    ): Promise<GenerateScheduleOutput> => ({
      teamId: input.teamId,
      period: {
        start: input.start,
        end: input.end,
        timeZone: input.timeZone,
      },
      assignments: [],
    }),

    ...overrides,
  }
}
