import { OptimizationModel, Variable, VariableType } from './optimization.model'

export class VariableBuilder {
  constructor(private model: OptimizationModel) {}

  addVariable(
    name: string,
    type: VariableType,
    min?: number,
    max?: number,
  ): Variable {
    const exists = this.model.variables.find(v => v.name === name)
    if (exists) {
      throw new Error(`Variable already exists: ${name}`)
    }

    const variable: Variable = {
      name,
      type,
      min,
      max,
    }

    this.model.variables.push(variable)
    return variable
  }
}

export function getAssignmentVariableName(
  teamMemberId: string,
  dayIndex: number,
  shiftTypeId: string,
): string {
  return `assign__${teamMemberId}__${dayIndex}__${shiftTypeId}`
}
