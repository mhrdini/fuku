import { PayGradeSchema, PayGradeShiftTypeSchema } from '@fuku/db/schemas'
import z from 'zod/v4'

export const PayGradeOutputSchema = PayGradeSchema.extend({
  description: z.string().nullable(),
  eligibleShiftTypes: z.array(PayGradeShiftTypeSchema),
})

export type PayGradeOutput = z.infer<typeof PayGradeOutputSchema>

export const PayGradeCreateInputSchema = PayGradeSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  connectShiftTypes: z.array(z.string()).optional(),
})

export const PayGradeUpdateInputSchema = PayGradeSchema.partial().extend({
  id: z.string(),
  connectShiftTypes: z.array(z.string()).optional(),
  disconnectShiftTypes: z.array(z.string()).optional(),
})

export type PayGradeCreateInput = z.infer<typeof PayGradeCreateInputSchema>
export type PayGradeUpdateInput = z.infer<typeof PayGradeUpdateInputSchema>
