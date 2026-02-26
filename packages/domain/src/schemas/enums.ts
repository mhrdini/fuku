import z from 'zod/v4'

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

export const OperatorSchema = z.enum(['MIN', 'MAX'])
export const OperatorValues = enumToSelfMap(OperatorSchema)
export type Operator = z.infer<typeof OperatorSchema>
