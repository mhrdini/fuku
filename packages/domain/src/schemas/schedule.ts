import { SchedulerAssignmentSchema, TimeZoneSchema } from '@fuku/domain/schemas'
import * as z from 'zod/v4'

import { UnavailabilitySchema } from './unavailability'

export const GenerateScheduleInputSchema = z.object({
  teamId: z.string(),
  start: z.date(),
  end: z.date(),
  timeZone: TimeZoneSchema,
  assignments: z.array(SchedulerAssignmentSchema).optional(),
  unavailabilities: z.array(UnavailabilitySchema).optional(),
})

export type GenerateScheduleInput = z.infer<typeof GenerateScheduleInputSchema>

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
