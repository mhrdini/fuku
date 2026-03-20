import { ShiftAssignmentSchema } from '@fuku/domain/schemas'
import * as z from 'zod/v4'

import { WorkHourOutputSchema } from './workHour'

export const ShiftAssignmentOutputSchema = ShiftAssignmentSchema.extend({
  locationId: z.string().nullable(),
  workHour: WorkHourOutputSchema.nullable(),
})

export type ShiftAssignmentOutput = z.infer<typeof ShiftAssignmentOutputSchema>
