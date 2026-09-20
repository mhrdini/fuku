import { faker } from '@faker-js/faker'

import type { Prisma } from '@prisma/client'

import { testDb } from '../database'

export async function createUser(overrides: Partial<Prisma.UserUncheckedCreateInput> = {}) {
  return testDb.user.create({
    data: {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      username: faker.internet.username(),
      displayUsername: faker.internet.username(),
      ...overrides,
    },
  })
}
