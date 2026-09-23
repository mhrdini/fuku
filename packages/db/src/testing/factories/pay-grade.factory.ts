import { faker } from '@faker-js/faker'

import type { Prisma } from '../../generated/prisma/client'

import { testDb } from '../database'

export async function createPayGrade(teamId: string, overrides: Partial<Omit<Prisma.PayGradeUncheckedCreateInput, 'teamId'>> = {}) {
  return testDb.payGrade.create({
    data: {
      name: faker.person.jobType(),
      baseRate: faker.number.int(),
      teamId,
      ...overrides,
    },
  })
}
