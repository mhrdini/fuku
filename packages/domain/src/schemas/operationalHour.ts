import z from 'zod/v4'

import { DayOfWeekSchema, Time } from './helpers'

export const OperationalHourSchema = z.object({
  teamId: z.string(),
  dayOfWeek: DayOfWeekSchema,
  startTime: Time,
  endTime: Time,

  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
  deletedById: z.string().nullable(),
})

export type OperationalHour = z.infer<typeof OperationalHourSchema>
