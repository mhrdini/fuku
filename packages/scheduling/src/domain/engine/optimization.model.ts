// export const VariableTypes = {
//   Binary: 'binary',
//   Integer: 'integer',
//   Continuous: 'continuous',
// } as const
// export type VariableType = (typeof VariableTypes)[keyof typeof VariableTypes]

// export const Operators = {
//   LessThanOrEqual: '<=',
//   GreaterThanOrEqual: '>=',
//   Equal: '=',
// }
// export type Operator = (typeof Operators)[keyof typeof Operators]

// export const ObjectiveSenses = {
//   Maximize: 'maximize',
//   Minimize: 'minimize',
// } as const
// export type ObjectiveSense =
//   (typeof ObjectiveSenses)[keyof typeof ObjectiveSenses]

export type VariableType = 'binary' | 'integer' | 'continuous'
export type Operator = '<=' | '>=' | '='
export type ObjectiveSense = 'maximize' | 'minimize'

export interface OptimizationVariable {
  name: string
  type: VariableType
  lowerBound?: number
  upperBound?: number
}

export type CoefficientMap = Record<string, number>
export interface LinearConstraint {
  name: string
  coefficients: CoefficientMap
  operator: Operator
  rhs: number
}

export interface ObjectiveTerm {
  variable: string
  coefficient: number
}

export interface OptimizationModel {
  variables: OptimizationVariable[]
  constraints: LinearConstraint[]
  objective?: {
    sense: ObjectiveSense
    terms: ObjectiveTerm[]
  }
}
