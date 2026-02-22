import {
  DayOfWeekKey,
  DayOfWeekKeySchema,
  DayOfWeekSchema,
  OperationalHourSchema,
} from '@fuku/db/schemas'
import z from 'zod/v4'

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
    dayOfWeek: DayOfWeekSchema,
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

export const OperationalHourOutputSchema = z
  .object(
    Object.fromEntries(
      DayOfWeekKeySchema.options.map(day => [
        day,
        OperationalHourOutputValueSchema,
      ]),
    ) as Record<DayOfWeekKey, typeof OperationalHourOutputValueSchema>,
  )
  .partial()

export type OperationalHourOutput = z.infer<typeof OperationalHourOutputSchema>
