import { ISODateString } from '@fuku/domain/schemas'
import {
  createHolidayChecker,
  preloadHolidaysForRange,
} from '@fuku/infrastructure/holiday'
import {
  addDays,
  getDaysBetweenInclusive,
  HolidayService,
  toJSDateFromISO,
} from '@fuku/scheduling'

export class NagerHolidayService implements HolidayService {
  async getHolidays(input: {
    country: string | null | undefined
    startDate: ISODateString
    endDate: ISODateString
  }): Promise<Set<string>> {
    const { country, startDate, endDate } = input

    const result = new Set<string>()

    if (!country) {
      return result
    }

    await preloadHolidaysForRange({
      country,
      startDate: toJSDateFromISO(startDate),
      endDate: toJSDateFromISO(endDate),
    })

    const isHoliday = createHolidayChecker(country)

    const totalDays = getDaysBetweenInclusive(startDate, endDate)

    for (let dayIndex = 0; dayIndex < totalDays; dayIndex++) {
      const date = addDays(startDate, dayIndex)

      if (isHoliday(date)) {
        result.add(date)
      }
    }

    return result
  }
}
