import * as z from 'zod/v4'

import { RuleConditionFieldSchema, RuleConditionOperatorSchema } from './enums'
import { JsonValueSchema } from './helpers'

export const RuleConditionSchema = z.object({
  id: z.string(),
  ruleId: z.string(),
  field: RuleConditionFieldSchema,
  operator: RuleConditionOperatorSchema,
  value: JsonValueSchema.nullable(),
})

export type RuleCondition = z.infer<typeof RuleConditionSchema>
