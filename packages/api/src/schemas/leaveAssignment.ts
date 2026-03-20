import { LeaveAssignmentSchema } from '@fuku/domain/schemas'
import * as z from 'zod/v4'

export const LeaveAssignmentOutputSchema = LeaveAssignmentSchema
export type LeaveAssignmentOutput = z.infer<typeof LeaveAssignmentOutputSchema>
