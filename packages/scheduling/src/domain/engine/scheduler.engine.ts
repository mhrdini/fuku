import { SchedulerContext, SchedulerResult } from '../types'
import { ConstraintModelBuilder } from './model.builder'
import { SolutionMapper } from './solution.mapper'
import { CpSatSolverAdapter } from './solver.adapter'

export interface SchedulerEngine {
  run(context: SchedulerContext): Promise<SchedulerResult>
}

export class DefaultSchedulerEngine implements SchedulerEngine {
  async run(ctx: SchedulerContext): Promise<SchedulerResult> {
    const model = new ConstraintModelBuilder(ctx).build()
    const solver = new CpSatSolverAdapter('http://localhost:8000/solve')
    const solverResult = await solver.solve(model)
    const mapper = new SolutionMapper(ctx, solverResult)
    const result = mapper.getResult()
    return result
  }
}
