import { ShiftTypeSchema } from '@fuku/db/schemas'
import z from 'zod/v4'

export const ShiftTypeUISchema = ShiftTypeSchema.omit({
  team: true,
})

export type ShiftTypeUI = z.infer<typeof ShiftTypeUISchema>
