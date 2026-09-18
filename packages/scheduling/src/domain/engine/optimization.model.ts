export type VariableType = 'binary' | 'integer'
export type Operator = '<=' | '>=' | '=='
export type ObjectiveSense = 'maximize' | 'minimize'

export type Variable = {
  name: string
  type: VariableType
  min?: number
  max?: number
}

export type CoefficientMap = Record<string, number>

export type Constraint = {
  name: string
  coefficients: CoefficientMap
  operator: Operator
  rhs: number
}

export type Objective = {
  sense: ObjectiveSense
  terms: ObjectiveTerm[]
}

export type ObjectiveTerm = {
  variable: string
  coefficient: number
}

export type OptimizationModel = {
  variables: Variable[]
  constraints: Constraint[]
  objective?: Objective
}
