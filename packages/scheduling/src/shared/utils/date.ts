import { DateTime } from 'luxon'

export interface Period {
  start: Date // first day of month at 00:00 in team timezone (returned as UTC Date)
  end: Date // last day of month at 23:59:59.999 in team timezone (returned as UTC Date)
  timeZone: string
}

/**
 * Convert JS Date into a Luxon DateTime in a specific timezone
 */
function toZonedDateTime(date: Date, timeZone: string): DateTime {
  return DateTime.fromJSDate(date, { zone: timeZone })
}

/**
 * Convert Luxon DateTime back to JS Date (UTC instant)
 */
function toJSDate(dt: DateTime): Date {
  return dt.toUTC().toJSDate()
}

/**
 * Get month range constructed directly in team timezone
 */
export function getPeriod(
  year: number,
  month: number,
  timeZone: string,
): Period {
  const start = DateTime.fromObject(
    { year, month, day: 1 },
    { zone: timeZone },
  ).startOf('day')

  const end = start.endOf('month')

  return {
    start: toJSDate(start),
    end: toJSDate(end),
    timeZone: timeZone,
  }
}

/**
 * Normalize a JS Date to midnight in a specific timezone
 */
export function normalizeToMidnight(date: Date, timeZone: string): Date {
  const dt = toZonedDateTime(date, timeZone).startOf('day')
  return toJSDate(dt)
}

/**
 * Generate all dates in a month at midnight in team timezone
 */
export function generateMonthDates(
  year: number,
  month: number,
  timeZone: string,
): Date[] {
  const base = DateTime.fromObject(
    { year, month, day: 1 },
    { zone: timeZone },
  ).startOf('day')

  return [...Array(base.daysInMonth).keys()].map((_, i) =>
    toJSDate(base.plus({ days: i })),
  )
}

/**
 * Compare if two JS Dates are same calendar day in a timezone
 */
export function isSameDay(date1: Date, date2: Date, timeZone: string): boolean {
  const d1 = toZonedDateTime(date1, timeZone)
  const d2 = toZonedDateTime(date2, timeZone)

  return d1.hasSame(d2, 'day')
}

/**
 * Convert a JS Date to another timezone but preserve instant
 * (returns new Date representing same instant)
 */
export function toZonedDate(date: Date, timeZone: string): Date {
  return toZonedDateTime(date, timeZone).toJSDate()
}

/**
 * Get timezone offset (in minutes) for a date in a zone
 */
export function getTimezoneOffset(date: Date, timeZone: string): number {
  return toZonedDateTime(date, timeZone).offset
}

/**
 * Add days respecting team timezone calendar logic
 */
export function addDays(date: Date, days: number, timeZone: string): Date {
  const dt = toZonedDateTime(date, timeZone).plus({ days })
  return toJSDate(dt)
}

/**
 * Get number of days in month
 */
export function getDaysInMonth(year: number, month: number): number {
  return DateTime.now().set({ year, month }).daysInMonth
}

/**
 * Check if a date is within range (all compared as UTC instants)
 */
export function isWithinRange(date: Date, start: Date, end: Date): boolean {
  const t = date.getTime()
  return t >= start.getTime() && t <= end.getTime()
}
