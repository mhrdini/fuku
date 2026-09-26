import { faker } from '@faker-js/faker'

import type { Prisma } from '../../generated/prisma/client'

import { testDb } from '../database'

export async function createLocation(
  teamId: string,
  overrides: Partial<Omit<Prisma.LocationUncheckedCreateInput, 'teamId'>> = {},
) {
  return testDb.location.create({
    data: {
      name: faker.location.street(),
      teamId,
      ...overrides,
    },
  })
}
