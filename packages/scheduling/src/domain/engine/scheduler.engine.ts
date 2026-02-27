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

    // console.log('variables:', model.variables.length)
    // console.log('constraints:', model.constraints.length)
    // console.log('objective terms:', model.objective?.terms.length)

    const solver = new CpSatSolverAdapter('http://localhost:8000/solve')
    const solverResult = await solver.solve(model)

    // console.log(
    //   'solver result:',
    //   solverResult.status,
    //   solverResult.error,
    //   solverResult.objectiveValue,
    // )

    const mapper = new SolutionMapper(ctx, solverResult)
    const result = mapper.getResult()

    return result
  }
}
