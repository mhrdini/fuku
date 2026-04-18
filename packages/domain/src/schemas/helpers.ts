import * as z from 'zod/v4'

import { ALL_COUNTRY_CODES } from '../i18n/country'

/** Common fields */
export const ColorHex = z.string().regex(/^#([0-9A-Fa-f]{6})$/)
export const Time = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'invalid_time_format')

export const WeekdaySchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
  z.literal(7),
]) // 1 = Monday, 7 = Sunday
export type Weekday = z.infer<typeof WeekdaySchema>

export const Weekdays = ['1', '2', '3', '4', '5', '6', '7'] as const
export const WeekdayKeySchema = z.enum(Weekdays)
export type WeekdayKey = z.infer<typeof WeekdayKeySchema>

export const Months = [
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  '11',
  '12',
] as const
export const MonthKeySchema = z.enum(Months)
export type MonthKey = z.infer<typeof MonthKeySchema>

export const SUPPORTED_TIME_ZONES = Intl.supportedValuesOf('timeZone')

export const TimeZoneSchema = z
  .string()
  .refine(tz => tz === 'UTC' || SUPPORTED_TIME_ZONES.includes(tz), {
    message: 'invalid_time_zone',
  })

export const JsonValueSchema = z.union([
  z.number(),
  z.array(z.number()),
  z.boolean(),
])

export type JsonValue = z.infer<typeof JsonValueSchema>

export const CountrySchema = z.enum(ALL_COUNTRY_CODES)
