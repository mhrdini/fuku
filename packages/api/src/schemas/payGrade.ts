import { PayGradeSchema } from '@fuku/domain/schemas'
import z from 'zod/v4'

import { PayGradeShiftTypeOutputSchema } from './payGradeShiftType'

export const PayGradeOutputSchema = PayGradeSchema.extend({
  description: z.string().nullable(),
  eligibleShiftTypes: z.array(PayGradeShiftTypeOutputSchema),
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
