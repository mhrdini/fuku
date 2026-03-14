import { RuleConditionSchema } from '@fuku/domain/schemas'
import * as z from 'zod/v4'

export const RuleConditionCreateInputSchema = RuleConditionSchema.omit({
  id: true,
})

export type RuleConditionCreateInput = z.infer<
  typeof RuleConditionCreateInputSchema
>

export const RuleConditionUpdateInputSchema =
  RuleConditionSchema.partial().extend({
    id: z.string(),
    ruleId: z.string(),
  })

export type RuleConditionUpdateInput = z.infer<
  typeof RuleConditionUpdateInputSchema
>

export const RuleConditionOutputSchema = RuleConditionSchema

export type RuleConditionOutput = z.infer<typeof RuleConditionOutputSchema>
