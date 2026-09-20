import { faker } from '@faker-js/faker'

import type { Prisma } from '@prisma/client'

import { testDb } from '../database'

export async function createWorkHour(
  shiftAssignmentId: string,
  overrides: Partial<
    Omit<Prisma.WorkHourUncheckedCreateInput, 'shiftAssignmentId'>
  > = {},
) {
  const actualStart = faker.date.recent()
  const actualEnd = new Date(
    actualStart.getTime() + faker.number.int({
      min: 1,
      max: 12,
    }) * 60 * 60 * 1000,
  )

  return testDb.workHour.create({
    data: {
      shiftAssignmentId,
      actualStart,
      actualEnd,
      rateMultiplier: 1,
      breakMinutes: 60,
      calculatedHours: 0,
      ...overrides,
    },
  })
}
