import * as z from 'zod/v4'

export function enumToSelfMap<T extends z.ZodEnum<any>>(
  schema: T,
): { [K in z.output<T>]: K } {
  return Object.fromEntries(Object.values(schema.enum).map(v => [v, v])) as {
    [K in z.output<T>]: K
  }
}

export const TeamMemberRoleSchema = z.enum(['ADMIN', 'STAFF'])
export const TeamMemberRoleValues = enumToSelfMap(TeamMemberRoleSchema)
export type TeamMemberRole = z.infer<typeof TeamMemberRoleSchema>

export const MetricSchema = z.enum([
  'DAYS_WORKED',
  'HOURS_WORKED',
  'DAYS_OFF',
  'CONSECUTIVE_DAYS_WORKED',
  'UNIQUE_MEMBERS_ASSIGNED',
])
export const MetricValues = enumToSelfMap(MetricSchema)
export type Metric = z.infer<typeof MetricSchema>

export const TimeWindowSchema = z.enum([
  'DAY',
  'WEEK',
  'MONTH',
  'ROLLING_WEEK',
  'ROLLING_MONTH',
])
export const TimeWindowValues = enumToSelfMap(TimeWindowSchema)
export type TimeWindow = z.infer<typeof TimeWindowSchema>

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

export const RuleConditionFieldSchema = z.enum(['MONTH', 'WEEKDAY'])
export const RuleConditionFieldValues = enumToSelfMap(RuleConditionFieldSchema)
export type RuleConditionField = z.infer<typeof RuleConditionFieldSchema>

export const RuleConditionOperatorSchema = z.enum([
  'EQ',
  'NEQ',
  'IN',
  'NOT_IN',
  'GTE',
  'LTE',
])

export const RuleConditionOperatorValues = enumToSelfMap(
  RuleConditionOperatorSchema,
)
export type RuleConditionOperator = z.infer<typeof RuleConditionOperatorSchema>
