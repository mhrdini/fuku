import { ShiftTypeOutputSchema } from '@fuku/api/schemas'

import type { ShiftTypeOutput } from '@fuku/api/schemas'
import type * as z from 'zod/v4'

export const ShiftTypeUISchema = ShiftTypeOutputSchema
export type ShiftTypeUI = z.infer<typeof ShiftTypeUISchema>

export function getShiftTypeName(st: ShiftTypeOutput | ShiftTypeUI): string {
  return st.name
}
