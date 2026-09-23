import { faker } from '@faker-js/faker'

import type { Prisma } from '../../generated/prisma/client'

import { testDb } from '../database'

export async function createUnavailability(
  teamMemberId: string,
  overrides: Partial<
    Omit<
      Prisma.UnavailabilityUncheckedCreateInput,
      'teamMemberId'
    >
  > = {},
) {
  return testDb.unavailability.create({
    data: {
      teamMemberId,
      date: faker.date.future(),
      reason: faker.helpers.maybe(() => faker.lorem.sentence()),
      ...overrides,
    },
  })
}
