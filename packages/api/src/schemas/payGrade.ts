import { PayGradeSchema } from '@fuku/db/schemas'
import z from 'zod/v4'

export const PayGradeOutputSchema = PayGradeSchema.extend({
  description: z.string().nullable(),
})

export type PayGradeOutput = z.infer<typeof PayGradeOutputSchema>

export const PayGradeCreateInputSchema = PayGradeSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export const PayGradeUpdateInputSchema = PayGradeSchema.partial().extend({
  id: z.string(),
})

export type PayGradeCreateInput = z.infer<typeof PayGradeCreateInputSchema>
export type PayGradeUpdateInput = z.infer<typeof PayGradeUpdateInputSchema>
