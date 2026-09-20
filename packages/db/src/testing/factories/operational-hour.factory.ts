import type { Prisma } from '@prisma/client'

import { testDb } from '../database'
import { generateTimeRange } from './utils'

export async function createOperationalHour(
  teamId: string,
  weekday: number,
  overrides: Partial<
    Omit<
      Prisma.OperationalHourUncheckedCreateInput,
      'teamId' | 'weekday'
    >
  > = {},
) {
  const { startTime, endTime } = generateTimeRange()

  return testDb.operationalHour.create({
    data: {
      weekday,
      startTime,
      endTime,
      teamId,
      ...overrides,
    },
  })
}
