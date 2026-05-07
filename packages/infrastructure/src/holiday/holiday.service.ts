type ISODateString = string // yyyy-MM-dd

type Holiday = {
  date: ISODateString
}

const holidayCache = new Map<string, Set<string>>() // key = `${country}-${year}`
const getCacheKey = (country: string, year: number) => `${country}-${year}`

export const preloadHolidays = async (
  year: number,
  country: string,
): Promise<void> => {
  const key = getCacheKey(country, year)

  if (holidayCache.has(key)) return

  const res = await fetch(
    `https://date.nager.at/api/v3/PublicHolidays/${year}/${country}`,
  )

  if (!res.ok) {
    throw new Error('Failed to fetch holidays')
  }

  const data: Holiday[] = await res.json()
  const set = new Set<string>()
  for (const h of data) {
    set.add(h.date)
  }

  holidayCache.set(key, set)
}

export const preloadHolidaysForRange = async (input: {
  startDate: Date
  endDate: Date
  country: string
}): Promise<void> => {
  const { startDate, endDate, country } = input

  const startYear = startDate.getFullYear()
  const endYear = endDate.getFullYear()

  const promises: Promise<void>[] = []
  for (let year = startYear; year <= endYear; year++) {
    promises.push(preloadHolidays(year, country))
  }

  await Promise.all(promises)
}

export const createHolidayChecker = (
  country: string,
): ((date: string) => boolean) => {
  return (date: string) => {
    const year = new Date(date).getFullYear()
    const key = getCacheKey(country, year)

    const set = holidayCache.get(key)
    if (!set) {
      throw new Error(`Holidays not preloaded for ${country} ${year}`)
    }
    return set.has(date)
  }
}
