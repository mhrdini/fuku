import * as z from 'zod/v4'

export const SchedulerAssignmentSchema = z.object({
  teamMemberId: z.string(),
  shiftTypeId: z.string(),
  date: z.coerce.date(),
  score: z.number().optional(),
})

export type SchedulerAssignment = z.infer<typeof SchedulerAssignmentSchema>

export const GenerateScheduleOutputSchema = z.object({
  teamId: z.string(),
  period: z.object({
    start: z.date(),
    end: z.date(),
  }),
  assignments: z.array(SchedulerAssignmentSchema),
})

export type GenerateScheduleOutput = z.infer<
  typeof GenerateScheduleOutputSchema
>
