import {
  DayAssignmentSchema,
  LeaveAssignmentSchema,
  ShiftAssignmentSchema,
} from '@fuku/domain/schemas'
import * as z from 'zod/v4'

import { LeaveAssignmentOutputSchema } from './leaveAssignment'
import { ShiftAssignmentOutputSchema } from './shiftAssignment'

export const DayAssignmentCreateInputSchema = DayAssignmentSchema.partial({
  id: true,
})

export type DayAssignmentCreateInput = z.infer<
  typeof DayAssignmentCreateInputSchema
>

export const DayAssignnmentUpdateInputSchema = DayAssignmentSchema.partial()
  .extend({
    id: z.string(),
  })
  .extend({
    shiftAssignment: ShiftAssignmentSchema.partial().nullable(),
    leaveAssignment: LeaveAssignmentSchema.partial().nullable(),
  })

export type DayAssignmentUpdateInput = z.infer<
  typeof DayAssignnmentUpdateInputSchema
>

export const DayAssignmentOutputSchema = DayAssignmentSchema.extend({
  shiftAssignment: ShiftAssignmentOutputSchema.nullable(),
  leaveAssignment: LeaveAssignmentOutputSchema.nullable(),
})

export type DayAssignmentOutput = z.infer<typeof DayAssignmentOutputSchema>
