import * as z from 'zod/v4'

import { Time, WeekdaySchema } from './helpers'

export const OperationalHourSchema = z.object({
  teamId: z.string(),
  weekday: WeekdaySchema,
  startTime: Time,
  endTime: Time,

  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
  deletedById: z.string().nullable(),
})

export type OperationalHour = z.infer<typeof OperationalHourSchema>
