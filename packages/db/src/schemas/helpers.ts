import z from 'zod/v4'

/** Common fields */
export const ColorHex = z.string().regex(/^#([0-9A-Fa-f]{6})$/)
export const Time = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'invalid_time_format')

export const DayOfWeekSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
  z.literal(7),
]) // 1 = Monday, 7 = Sunday
export type DayOfWeek = z.infer<typeof DayOfWeekSchema>

export const DayOfWeekKeySchema = z.enum(['1', '2', '3', '4', '5', '6', '7'])
export type DayOfWeekKey = z.infer<typeof DayOfWeekKeySchema>

export const supportedTimeZones = Intl.supportedValuesOf('timeZone')

export const TimeZone = z
  .string()
  .refine(tz => supportedTimeZones.includes(tz), {
    message: 'invalid_time_zone',
  })
