import { ShiftTypeOutputSchema } from '@fuku/api/schemas'
import z from 'zod/v4'

export const ShiftTypeUISchema = ShiftTypeOutputSchema
export type ShiftTypeUI = z.infer<typeof ShiftTypeUISchema>
