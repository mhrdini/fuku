import * as z from 'zod/v4'




export function enumToSelfMap<T extends z.ZodEnum<any>>(
  schema: T,
): { [K in z.output<T>]: K } {
  return Object.fromEntries(Object.values(schema.enum).map(v => [v, v])) as {
    [K in z.output<T>]: K
  }
}

// -------------------------
// Team Member Role
// -------------------------

export const TeamMemberRoleSchema = z.enum(['ADMIN', 'STAFF'])
export const TeamMemberRoleValues = enumToSelfMap(TeamMemberRoleSchema)
export type TeamMemberRole = z.infer<typeof TeamMemberRoleSchema>

// -------------------------
// Rule
// -------------------------

export const RuleMetricSchema = z.enum([
  'DAYS_WORKED',
  'HOURS_WORKED',
  'DAYS_OFF',
  'CONSECUTIVE_DAYS_WORKED',
  'UNIQUE_MEMBERS_ASSIGNED',
])
export const RuleMetricValues = enumToSelfMap(RuleMetricSchema)
export type RuleMetric = z.infer<typeof RuleMetricSchema>

export const RuleTimeWindowSchema = z.enum([
  'DAY',
  'WEEK',
  'MONTH',
  'ROLLING_WEEK',
  'ROLLING_MONTH',
])
export const RuleTimeWindowValues = enumToSelfMap(RuleTimeWindowSchema)
export type RuleTimeWindow = z.infer<typeof RuleTimeWindowSchema>

export const RuleOperatorSchema = z.enum(['MIN', 'MAX'])
export const RuleOperatorValues = enumToSelfMap(RuleOperatorSchema)
export type RuleOperator = z.infer<typeof RuleOperatorSchema>

export const RuleTargetSchema = z.enum([
  'PAY_GRADE',
  'SHIFT_TYPE',
  'TEAM_MEMBER',
  'GLOBAL',
])
export const RuleTargetValues = enumToSelfMap(RuleTargetSchema)
export type RuleTarget = z.infer<typeof RuleTargetSchema>
