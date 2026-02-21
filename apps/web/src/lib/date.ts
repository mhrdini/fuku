import { DayOfWeekKey, supportedTimeZones } from '@fuku/db/schemas'
import { DateTime, WeekdayNumbers } from 'luxon'

export const WEEKDAY_MAP: Record<DayOfWeekKey, string> = Array.from(
  { length: 7 },
  (_, i) => i + 1,
).reduce(
  (acc, day) => {
    const key = String(day) as DayOfWeekKey
    acc[key] = DateTime.fromObject({
      weekday: day as WeekdayNumbers,
    }).weekdayLong!
    return acc
  },
  {} as Record<DayOfWeekKey, string>,
)

function generateTimeOptions(minuteInterval: number = 30): string[] {
  const options = []

  for (let minutes = 0; minutes < 24 * 60; minutes += minuteInterval) {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60

    const hh = String(hours).padStart(2, '0')
    const mm = String(mins).padStart(2, '0')

    options.push(`${hh}:${mm}`)
  }
  return options
}

export const TIME_OPTIONS = generateTimeOptions()

export type TimeZoneOption = {
  value: string
  label: string
  offset: string
  offsetMinutes: number
  region: string
}

function getOffsetInfo(timeZone: string) {
  const date = new Date()

  // Get long offset like "GMT+09:00"
  const longFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: 'longOffset',
  })

  const longParts = longFormatter.formatToParts(date)
  const longOffset =
    longParts.find(p => p.type === 'timeZoneName')?.value ?? 'GMT+00:00'

  let offset = longOffset.replace('GMT', 'UTC')
  if (offset === 'UTC') {
    offset = 'UTC+00:00'
  }

  // Convert offset to minutes for proper numeric sorting
  const match = offset.match(/UTC([+-]\d{2}):(\d{2})/)
  let offsetMinutes = 0

  if (match) {
    const hours = parseInt(match[1], 10)
    const minutes = parseInt(match[2], 10)
    offsetMinutes = hours * 60 + Math.sign(hours) * minutes
  }

  // Get abbreviation like "JST", "AEDT", "EST"
  const shortFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: 'short',
  })

  const shortParts = shortFormatter.formatToParts(date)
  const abbr = shortParts.find(p => p.type === 'timeZoneName')?.value ?? ''

  return { offset, offsetMinutes, abbr }
}

export function getGroupedTimeZones(): Record<string, TimeZoneOption[]> {
  const zones = supportedTimeZones
  const result: Record<string, TimeZoneOption[]> = {}

  for (const zone of zones) {
    const [region, city] = zone.split('/')
    if (!city) continue

    const { offset, offsetMinutes, abbr } = getOffsetInfo(zone)
    // Replace underscores
    let name = city.replaceAll('_', ' ')

    // Split camel case
    name = name.replace(/([a-z])([A-Z])/g, '$1 $2')

    // Fix common French particles
    name = name.replace(/DU/g, "d'U")
    name = name.replace(/DA/g, "d'A")

    const option: TimeZoneOption = {
      value: zone,
      label: `${name} (${abbr})`,
      offset,
      offsetMinutes,
      region,
    }

    if (!result[region]) result[region] = []
    result[region].push(option)
  }

  // sort by offset, then city name
  for (const region in result) {
    result[region].sort((a, b) => {
      if (a.offsetMinutes === b.offsetMinutes) {
        return a.label.localeCompare(b.label)
      }
      return a.offsetMinutes - b.offsetMinutes
    })
  }

  return result
}
