import { ColorHex, ShiftTypeSchema } from '@fuku/db/schemas'
import z from 'zod/v4'

export const ShiftTypeOutputSchema = ShiftTypeSchema.extend({
  description: z.string().nullable(),
  color: ColorHex,
})

export type ShiftTypeOutput = z.infer<typeof ShiftTypeOutputSchema>

export const ShiftTypeCreateInputSchema = ShiftTypeSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  deletedById: true,
})

export const ShiftTypeUpdateInputSchema = ShiftTypeSchema.partial().extend({
  id: z.string(),
})

export type ShiftTypeCreateInput = z.infer<typeof ShiftTypeCreateInputSchema>
export type ShiftTypeUpdateInput = z.infer<typeof ShiftTypeUpdateInputSchema>
