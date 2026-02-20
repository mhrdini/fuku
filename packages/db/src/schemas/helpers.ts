import z from 'zod/v4'

/** Common fields */
export const ColorHex = z.string().regex(/^#([0-9A-Fa-f]{6})$/)
export const Time = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'invalid_time_format')

export const supportedTimeZones = Intl.supportedValuesOf('timeZone')

export const TimeZone = z
  .string()
  .refine(tz => supportedTimeZones.includes(tz), {
    message: 'invalid_time_zone',
  })
