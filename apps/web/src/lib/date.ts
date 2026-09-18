import { SUPPORTED_TIME_ZONES } from '@fuku/domain/schemas'
import i18next from '@fuku/i18n/server'

import type { TimeZone } from '@fuku/domain/schemas'

export function getMonthMap() {
  return new Map<string, string>(
    Array.from({ length: 12 }, (_, i) => i + 1)
      .map(String)
      .map(v => [v, `MONTH_${v}`]),
  )
}

export function getWeekdayMap() {
  return new Map<string, string>(
    Array.from({ length: 7 }, (_, i) => i + 1)
      .map(String)
      .map(v => [v, `WEEKDAY_${v}`]),
  )
}

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

function getOffsetInfo(timeZone: TimeZone) {
  const date = new Date()

  const longFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: 'longOffset',
  })

  const longParts = longFormatter.formatToParts(date)
  const longOffset
    = longParts.find(p => p.type === 'timeZoneName')?.value ?? 'GMT+00:00'

  let offset = longOffset.replace('GMT', 'UTC')
  if (offset === 'UTC') {
    offset = 'UTC+00:00'
  }

  const match = offset.match(/UTC([+-]\d{2}):(\d{2})/)
  let offsetMinutes = 0

  if (match) {
    const hours = parseInt(match[1], 10)
    const minutes = parseInt(match[2], 10)
    offsetMinutes = hours * 60 + Math.sign(hours) * minutes
  }

  const shortFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: 'short',
  })

  const shortParts = shortFormatter.formatToParts(date)
  const abbr = shortParts.find(p => p.type === 'timeZoneName')?.value ?? ''

  return { offset, offsetMinutes, abbr }
}

export function getGroupedTimeZones(): Record<string, TimeZoneOption[]> {
  const zones = SUPPORTED_TIME_ZONES
  const result: Record<string, TimeZoneOption[]> = {}

  for (const zone of zones) {
    const [region, city] = zone.split('/')
    if (!city)
      continue

    const { offset, offsetMinutes, abbr } = getOffsetInfo(zone)
    let name = city.replaceAll('_', ' ')

    name = name.replace(/([a-z])([A-Z])/g, '$1 $2')

    name = name.replace(/DU/g, 'd\'U')
    name = name.replace(/DA/g, 'd\'A')

    const option: TimeZoneOption = {
      value: zone,
      label: i18next.t('nameAbbr', '{{name}} ({{abbr}})', { name, abbr }),
      offset,
      offsetMinutes,
      region,
    }

    if (!result[region])
      result[region] = []
    result[region].push(option)
  }

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
