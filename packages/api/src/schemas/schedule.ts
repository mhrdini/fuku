import { SchedulerAssignmentSchema } from '@fuku/domain/schemas'
import * as z from 'zod/v4'

export const GenerateScheduleOutputSchema = z.object({
  id: z.string(),
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
