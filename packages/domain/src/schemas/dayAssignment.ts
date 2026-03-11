import { z } from 'zod/v4'

import { LeaveAssignmentSchema } from './leaveAssignment'
import { ShiftAssignmentSchema } from './shiftAssignment'

export const DayAssignmentSchema = z.object({
  id: z.string(),
  date: z.date(),
  teamMemberId: z.string(),
  shiftAssignment: ShiftAssignmentSchema.optional(),
  leaveAssignment: LeaveAssignmentSchema.optional(),
})

export type DayAssignment = z.infer<typeof DayAssignmentSchema>
