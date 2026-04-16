import {
  RuleConditionSchema,
  RuleConditionUndiscriminatedSchema,
} from '@fuku/domain/schemas'
import * as z from 'zod/v4'

export const RuleConditionCreateInputSchema =
  RuleConditionUndiscriminatedSchema.omit({
    id: true,
  })

export type RuleConditionCreateInput = z.infer<
  typeof RuleConditionCreateInputSchema
>

export const RuleConditionUpdateInputSchema =
  RuleConditionUndiscriminatedSchema.partial({
    field: true,
    operator: true,
    value: true,
  })

export type RuleConditionUpdateInput = z.infer<
  typeof RuleConditionUpdateInputSchema
>

export const RuleConditionOutputSchema = RuleConditionSchema

export type RuleConditionOutput = z.infer<typeof RuleConditionOutputSchema>
