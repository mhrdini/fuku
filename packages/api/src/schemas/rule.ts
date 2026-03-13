import { RuleSchema } from '@fuku/domain/schemas'
import * as z from 'zod/v4'

export const RuleCreateInputSchema = RuleSchema.omit({
  id: true,
})

export type RuleCreateInput = z.infer<typeof RuleCreateInputSchema>

export const RuleUpdateInputSchema = RuleSchema.omit({
  teamId: true,
}).partial({
  id: true,
})

export type RuleUpdateInput = z.infer<typeof RuleUpdateInputSchema>

export const RuleOutputSchema = RuleSchema.extend({
  payGradeId: z.string().nullable(),
  shiftTypeId: z.string().nullable(),
  teamMemberId: z.string().nullable(),
  penalty: z.number().nonnegative().nullable(),
})

export type RuleOutput = z.infer<typeof RuleOutputSchema>
