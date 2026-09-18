import type { ISODateString } from '@fuku/domain/schemas'

export type HolidayService = {
  getHolidays: (input: {
    country: string | null | undefined
    startDate: ISODateString
    endDate: ISODateString
  }) => Promise<Set<string>> // or string[]?
}
