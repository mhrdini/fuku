import * as z from 'zod/v4'

export const LeaveAssignmentSchema = z.object({
  id: z.string(),
  paid: z.boolean(),
  dayAssignmentId: z.string(),
})

export type LeaveAssignment = z.infer<typeof LeaveAssignmentSchema>
