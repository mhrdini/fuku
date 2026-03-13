import { ColorHex, ShiftTypeSchema } from '@fuku/domain/schemas'
import * as z from 'zod/v4'

import { PayGradeShiftTypeOutputSchema } from './payGradeShiftType'

export const ShiftTypeOutputSchema = ShiftTypeSchema.extend({
  description: z.string().nullable(),
  color: ColorHex,
  allowedWeekdays: z.array(z.number().int().min(1).max(7)),
  eligiblePayGrades: z.array(PayGradeShiftTypeOutputSchema),
})

export type ShiftTypeOutput = z.infer<typeof ShiftTypeOutputSchema>

export const ShiftTypeCreateInputSchema = ShiftTypeSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  deletedById: true,
}).extend({
  connectPayGrades: z.array(z.string()).optional(),
})

export const ShiftTypeUpdateInputSchema = ShiftTypeSchema.partial().extend({
  id: z.string(),
  connectPayGrades: z.array(z.string()).optional(),
  disconnectPayGrades: z.array(z.string()).optional(),
})

export type ShiftTypeCreateInput = z.infer<typeof ShiftTypeCreateInputSchema>
export type ShiftTypeUpdateInput = z.infer<typeof ShiftTypeUpdateInputSchema>
