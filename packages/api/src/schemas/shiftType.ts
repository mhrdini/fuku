import { ColorHex, ShiftTypeSchema, Time } from '@fuku/db/schemas'
import z from 'zod/v4'

export const ShiftTypeOutputSchema = ShiftTypeSchema.extend({
  description: z.string().nullable(),
  color: ColorHex,
})

export type ShiftTypeOutput = z.infer<typeof ShiftTypeOutputSchema>

export const ShiftTypeCreateInputSchema = ShiftTypeSchema.extend({
  startTime: Time,
  endTime: Time,
  name: z.string().min(1, { error: 'invalid_shift_type_name' }),
  description: z.string().nullish(),
  color: ColorHex.optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  deletedById: true,
})

export const ShiftTypeUpdateInputSchema = ShiftTypeSchema.partial().extend({
  id: z.string(),
  name: z.string().min(1, 'invalid_shift_type_name').optional(),
  startTime: Time.optional(),
  endTime: Time.optional(),
})

export type ShiftTypeCreateInput = z.infer<typeof ShiftTypeCreateInputSchema>
export type ShiftTypeUpdateInput = z.infer<typeof ShiftTypeUpdateInputSchema>
