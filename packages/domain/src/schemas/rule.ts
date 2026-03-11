import { z } from 'zod/v4'

import {
  MetricSchema,
  RuleOperatorSchema,
  RuleTargetSchema,
  TimeWindowSchema,
} from './enums'

export const RuleSchema = z.object({
  id: z.string(),
  teamId: z.string(),
  target: RuleTargetSchema,
  payGradeId: z.string().optional(),
  shiftTypeId: z.string().optional(),
  teamMemberId: z.string().optional(),
  metric: MetricSchema,
  timeWindow: TimeWindowSchema,
  operator: RuleOperatorSchema,
  threshold: z.number(),
  hardConstraint: z.boolean(),
  penalty: z.number().nonnegative().optional(),
})

export type Rule = z.infer<typeof RuleSchema>
