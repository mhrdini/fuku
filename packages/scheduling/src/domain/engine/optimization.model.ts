export type VariableType = 'binary' | 'integer'
export type Operator = '<=' | '>=' | '=='
export type ObjectiveSense = 'maximize' | 'minimize'

export interface Variable {
  name: string
  type: VariableType
  min?: number
  max?: number
}

export type CoefficientMap = Record<string, number>

export interface Constraint {
  name: string
  coefficients: CoefficientMap
  operator: Operator
  rhs: number
}

export interface Objective {
  sense: ObjectiveSense
  terms: ObjectiveTerm[]
}

export interface ObjectiveTerm {
  variable: string
  coefficient: number
}

export interface OptimizationModel {
  variables: Variable[]
  constraints: Constraint[]
  objective?: Objective
}
