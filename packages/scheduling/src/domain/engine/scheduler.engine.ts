import { DateTime } from 'luxon'

import { SchedulerContext, SchedulerResult } from '../types'
import { ConstraintModelBuilder } from './model.builder'

export interface SchedulerEngine {
  run(context: SchedulerContext): SchedulerResult
}

export class DefaultSchedulerEngine implements SchedulerEngine {
  run(ctx: SchedulerContext): SchedulerResult {
    const modelBuilder = new ConstraintModelBuilder(ctx)
    const model = modelBuilder.build()

    console.log('model built:', DateTime.now())

    return {
      success: true,
      proposedAssignments: [],
      metrics: {
        totalSlotsRequired: 0,
        totalSlotsFilled: 0,
        totalOperationalCoverage: 0,
        fairnessStdDeviation: 0,
        totalHardConstraintViolations: 0,
        totalSoftPenalty: 0,
      },
    }
  }
}
