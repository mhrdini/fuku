import {
  ObjectiveSense,
  Operator,
  OptimizationModel,
  VariableType,
} from './optimization.model'

const SCALE = 1000
const MAX_SAFE = 100000

// ---- Generic ----
export interface SolverAdapter {
  solve(model: OptimizationModel): Promise<SolverResult>
  variableTypeMap: Record<VariableType, string>
}

export interface SolverPayload {
  variables: {
    name: string
    type: string
    min: number
    max: number
  }[]
  constraints: {
    name: string
    terms: {
      var: string
      coeff: number
    }[]
    rhs: number
    op: Operator
  }[]
  objective?: {
    sense: ObjectiveSense
    terms: {
      var: string
      coeff: number
    }[]
  }
  options?: Record<string, any>
}
export interface SolverResult {
  status: string
  values?: Record<string, number>
  objectiveValue?: number
  solutionInfo?: string
  addedConstraints?: string[]
  error?: string
}

// ---- CP-SAT Specific ----
export class CpSatSolverAdapter implements SolverAdapter {
  constructor(private solverUrl: string) {}

  variableTypeMap = {
    binary: 'bool',
    integer: 'int',
  }

  async solve(model: OptimizationModel): Promise<SolverResult> {
    const options = {
      time_limit_seconds: 100,
    }

    const payload = this.buildPayload(model, options)

    const response = await fetch(this.solverUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const result = await this.getResult(response)

    return result
  }

  private buildPayload(
    model: OptimizationModel,
    options?: Record<string, any>,
  ): SolverPayload {
    const payload: SolverPayload = {
      variables: model.variables.map(v => ({
        name: v.name,
        type: this.variableTypeMap[v.type],
        min:
          v.type === 'binary'
            ? 0
            : v.min !== undefined
              ? this.scaleForSolver(v.min)
              : Number.MIN_SAFE_INTEGER,
        max:
          v.type === 'binary'
            ? 1
            : v.max !== undefined
              ? this.scaleForSolver(v.max)
              : MAX_SAFE,
      })),
      constraints: model.constraints.map(c => ({
        name: c.name,
        terms: Object.entries(c.coefficients).map(([varName, coeff]) => ({
          var: varName,
          coeff: this.scaleForSolver(coeff),
        })),
        rhs: this.scaleForSolver(c.rhs),
        op: c.operator,
      })),
      ...(model.objective
        ? {
            objective: {
              sense: model.objective.sense,
              terms: model.objective.terms.map(t => ({
                var: t.variable,
                coeff: this.scaleForSolver(t.coefficient),
              })),
            },
          }
        : {}),
      options,
    }

    return payload
  }

  private async getResult(response: Response): Promise<SolverResult> {
    if (!response.ok) {
      throw new Error(
        `Solver request failed: ${response.status} ${response.statusText}`,
      )
    }

    const body = await response.json()

    const result = {
      status: body.status,
      values: body.values,
      objectiveValue: body.objective_value,
      solutionInfo: body.solution_info,
      addedConstraints: body.added_constraints,
      error: body.error,
    }

    return result
  }

  // --- Helpers ---
  private scaleForSolver(v: number): number {
    return Math.round(v * SCALE)
  }
}
