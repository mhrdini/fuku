import * as z from 'zod/v4'

import { RuleConditionFieldSchema, RuleConditionOperatorSchema } from './enums'

export const RuleConditionSchema = z.object({
  id: z.string(),
  ruleId: z.string(),
  field: RuleConditionFieldSchema,
  operator: RuleConditionOperatorSchema,
  value: z.union([
    z.number(),
    z.array(z.number()),
    z.string(),
    z.array(z.string()),
  ]),
})

export type RuleCondition = z.infer<typeof RuleConditionSchema>
