import { faker } from '@faker-js/faker'

import type { Prisma } from '@prisma/client'

import { testDb } from '../database'

export async function createTeam(overrides: Partial<Prisma.TeamUncheckedCreateInput> = {}) {
  return testDb.team.create({
    data: {
      name: faker.lorem.words(2),
      slug: faker.lorem.slug(),
      timeZone: faker.date.timeZone(),
      ...overrides,
    },
  })
}
