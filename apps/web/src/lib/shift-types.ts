import { ShiftTypeOutput, ShiftTypeOutputSchema } from '@fuku/api/schemas'
import * as z from 'zod/v4'

export const ShiftTypeUISchema = ShiftTypeOutputSchema
export type ShiftTypeUI = z.infer<typeof ShiftTypeUISchema>

export const getShiftTypeName = (st: ShiftTypeOutput | ShiftTypeUI): string => {
  return st.name
}
