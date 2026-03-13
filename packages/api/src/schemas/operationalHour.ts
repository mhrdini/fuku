import {
  OperationalHourSchema,
  WeekdayKey,
  WeekdayKeySchema,
  WeekdaySchema,
} from '@fuku/domain/schemas'
import * as z from 'zod/v4'

export const OperationalHourCreateInputSchema = OperationalHourSchema.omit({
  createdAt: true,
  updatedAt: true,
  deletedById: true,
}).extend({
  deletedAt: z.date().nullable(),
})

export type OperationalHourCreateInput = z.infer<
  typeof OperationalHourCreateInputSchema
>

export const OperationalHourUpdateInputSchema =
  OperationalHourSchema.partial().extend({
    teamId: z.string(),
    weekday: WeekdaySchema,
  })

export type OperationalHourUpdateInput = z.infer<
  typeof OperationalHourUpdateInputSchema
>

const OperationalHourOutputValueSchema = OperationalHourSchema.pick({
  teamId: true,
  startTime: true,
  endTime: true,
  deletedAt: true,
}).nullable()

export const OperationalHoursOutputSchema = z
  .object(
    Object.fromEntries(
      WeekdayKeySchema.options.map(day => [
        day,
        OperationalHourOutputValueSchema,
      ]),
    ) as Record<WeekdayKey, typeof OperationalHourOutputValueSchema>,
  )
  .partial()

export type OperationalHoursOutput = z.infer<
  typeof OperationalHoursOutputSchema
>
