import { faker } from '@faker-js/faker'

import type { Prisma } from '../../generated/prisma/client'

import { testDb } from '../database'
import { generateTimeRange } from './utils'

export async function createShiftType(
  teamId: string,
  overrides: Partial<
    Omit<Prisma.ShiftTypeUncheckedCreateInput, 'teamId'>
  > = {},
) {
  const { startTime, endTime } = generateTimeRange()

  return testDb.shiftType.create({
    data: {
      name: faker.word.noun(),
      startTime,
      endTime,
      teamId,
      ...overrides,
    },
  })
}
