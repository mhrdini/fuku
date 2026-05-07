import { ISODateString, TimeZone } from '@fuku/domain/schemas'
import { DateTime } from 'luxon'

export function toISODateFromJS(date: Date, timeZone?: TimeZone): string {
  if (!timeZone) {
    return DateTime.fromJSDate(date).toISODate()!
  }
  return DateTime.fromJSDate(date, { zone: timeZone }).toISODate()!
}

export function toJSDateFromISO(isoDate: string, timeZone?: TimeZone): Date {
  if (!timeZone) {
    return DateTime.fromISO(isoDate).startOf('day').toUTC().toJSDate()
  }
  return DateTime.fromISO(isoDate, { zone: timeZone })
    .startOf('day')
    .toUTC()
    .toJSDate()
}

export function toISODateTime(date: DateTime) {
  return date.toISO()!
}

export interface Period {
  start: ISODateString
  end: ISODateString
  timeZone: TimeZone
}

/**
 * Convert ISO DateTime string into a Luxon DateTime in a specific timezone
 */
export function toZonedDateTime(
  date: ISODateString,
  timeZone: TimeZone,
): DateTime {
  return DateTime.fromISO(date, { zone: timeZone })
}

/**
 * Convert Luxon DateTime back to JS Date (UTC instant)
 */
export function toJSDate(dt: DateTime): Date {
  return dt.toUTC().toJSDate()
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

export const parseISODate = (date: ISODateString) =>
  DateTime.fromFormat(date, 'yyyy-MM-dd')

export const addDays = (date: ISODateString, days: number): ISODateString =>
  parseISODate(date).plus({ days }).toISODate()!

export const getWeekday = (date: ISODateString): number =>
  parseISODate(date).weekday

export const getMonth = (date: ISODateString): number =>
  parseISODate(date).month

export const getDaysBetweenInclusive = (
  start: ISODateString,
  end: ISODateString,
): number =>
  Math.floor(parseISODate(end).diff(parseISODate(start), 'days').as('days')) + 1

export const getMinutesBetweenTimes = (start: string, end: string): number => {
  const s = DateTime.fromFormat(start, 'HH:mm')
  const e = DateTime.fromFormat(end, 'HH:mm')

  return e.diff(s, 'minutes').as('minutes')
}

export const timeToMinutes = (time: string): number => {
  const [hour, minute] = time.split(':').map(Number)
  return hour * 60 + minute
}

export const getDaysDifference = (
  startDate: string,
  endDate: string,
): number => {
  return Math.floor(
    DateTime.fromISO(endDate)
      .startOf('day')
      .diff(DateTime.fromISO(startDate).startOf('day'), 'days').days,
  )
}
