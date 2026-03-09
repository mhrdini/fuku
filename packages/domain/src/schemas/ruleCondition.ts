import { z } from 'zod/v4'

import { RuleConditionFieldSchema, RuleConditionOperatorSchema } from './enums'

export const RuleConditionSchema = z.object({
  id: z.string(),
  ruleId: z.string(),
  field: RuleConditionFieldSchema,
  operator: RuleConditionOperatorSchema,
  value: z.json(),
})
