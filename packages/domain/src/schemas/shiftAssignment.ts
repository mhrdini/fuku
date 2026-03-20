import * as z from 'zod/v4'

import { WorkHourSchema } from './workHour'

export const ShiftAssignmentSchema = z.object({
  id: z.string(),
  locationId: z.string().optional(),
  shiftTypeId: z.string(),
  dayAssignmentId: z.string(),
  workHour: WorkHourSchema.optional(),
})

export type ShiftAssignment = z.infer<typeof ShiftAssignmentSchema>
