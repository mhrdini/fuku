import { faker } from '@faker-js/faker'

import type { Prisma } from '@prisma/client'

import { testDb } from '../database'

export async function createDayAssignment(
  teamMemberId: string,
  overrides: Partial<
    Omit<Prisma.DayAssignmentUncheckedCreateInput, 'teamMemberId'>
  > = {},
) {
  return testDb.dayAssignment.create({
    data: {
      date: faker.date.future(),
      teamMemberId,
      ...overrides,
    },
  })
}
