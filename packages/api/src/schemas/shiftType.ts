import { ColorHex, ShiftTypeSchema, Time } from '@fuku/db/schemas'
import z from 'zod/v4'

export const ShiftTypeOutputSchema = ShiftTypeSchema.extend({
  description: z.string().nullable(),
  color: ColorHex,
})

export type ShiftTypeOutput = z.infer<typeof ShiftTypeOutputSchema>

export const ShiftTypeCreateInputSchema = ShiftTypeSchema.pick({
  id: true,
  name: true,
  startTime: true,
  endTime: true,
}).extend({
  name: z.string().min(1, 'invalid_shift_type_name'),
})

export const ShiftTypeUpdateInputSchema = ShiftTypeSchema.partial().extend({
  id: z.string(),
  name: z.string().min(1, 'invalid_shift_type_name').optional(),
  startTime: Time.optional(),
  endTime: Time.optional(),
})
