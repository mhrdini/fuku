import * as z from 'zod/v4'

export const SchedulerAssignmentSchema = z.object({
  id: z.string(),
  teamMemberId: z.string(),
  shiftTypeId: z.string(),
  date: z.coerce.date(),
  score: z.number().optional(),
})

export type SchedulerAssignment = z.infer<typeof SchedulerAssignmentSchema>
