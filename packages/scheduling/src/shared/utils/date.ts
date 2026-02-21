import { DateTime } from 'luxon'

export type Zoned<T, K extends keyof T> = Omit<T, K> & {
  [P in K]: DateTime
}

export interface Period {
  start: Date // first day of month at 00:00 in team timezone (returned as UTC Date)
  end: Date // last day of month at 23:59:59.999 in team timezone (returned as UTC Date)
  timeZone: string
}

export type ZonedPeriod = Zoned<Period, 'start' | 'end'>

/**
 * Convert JS Date into a Luxon DateTime in a specific timezone
 */
export function toZonedDateTime(date: Date, timeZone: string): DateTime {
  return DateTime.fromJSDate(date, { zone: timeZone })
}

/**
 * Convert Luxon DateTime back to JS Date (UTC instant)
 */
export function toJSDate(dt: DateTime): Date {
  return dt.toUTC().toJSDate()
}

/**
 * Get month range constructed directly in team timezone,
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

export function toZonedPeriod(period: Period): ZonedPeriod {
  return {
    ...period,
    start: toZonedDateTime(period.start, period.timeZone),
    end: toZonedDateTime(period.end, period.timeZone),
  }
}

/**
 * Normalize a DateTime to midnight in a specific timezone
 */
export function normalizeToMidnight(dt: DateTime): DateTime {
  return dt.startOf('day')
}

export function toMinutesFromMidnight(dt: DateTime): number {
  return dt.hour * 60 + dt.minute
}

export function getDateTimeFromMinutesFromMidnight(
  minutesFromMidnight: number,
): DateTime {
  const hours = Math.floor(minutesFromMidnight / 60)
  const minutes = minutesFromMidnight % 60
  return DateTime.fromObject({ hour: hours, minute: minutes })
}

/**
 *
 * @param period to denote the start and end period for which to generate the
 * days
 * @returns array of DateTimes for each day in the period
 * normalised to midnight (i.e. 00:00:00) in team timezone
 */
export function generateDateTimes(period: ZonedPeriod): DateTime[] {
  const dates: DateTime[] = []
  let current = period.start

  while (current <= period.end) {
    dates.push(current)
    current = current.plus({ days: 1 })
  }

  return dates
}

/**
 * Compare if two JS Dates are same calendar day in a timezone
 */
export function isSameDate(
  date1: Date,
  date2: Date,
  timeZone: string,
): boolean {
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
