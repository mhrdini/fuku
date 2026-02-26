import z from 'zod/v4'

import { MetricSchema, OperatorSchema, TimeWindowSchema } from './enums'

export const RuleSchema = z.object({
  id: z.string(),
  payGradeId: z.string(),
  metric: MetricSchema,
  timeWindow: TimeWindowSchema,
  operator: OperatorSchema,
  threshold: z.number(),
  hardConstraint: z.boolean(),
})

export type Rule = z.infer<typeof RuleSchema>
