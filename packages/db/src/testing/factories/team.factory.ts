import { faker } from '@faker-js/faker'

import type { Prisma } from '../../generated/prisma/client'

import { testDb } from '../database'

export async function createTeam(
  userId: string,
  overrides: Partial<Omit<Prisma.TeamUncheckedCreateInput, 'adminUsers' | 'teamMembers'>> = {},
) {
  return testDb.team.create({
    data: {
      name: faker.lorem.words(2),
      slug: faker.lorem.slug(),
      timeZone: faker.date.timeZone(),
      adminUsers: {
        connect: {
          id: userId,
        },
      },

      teamMembers: {
        create: {
          userId,
          familyName: faker.person.lastName(),
          givenNames: faker.person.firstName(),
          teamMemberRole: 'ADMIN',
        },
      },
      lastActiveUsers: {
        connect: {
          id: userId,
        },
      },
      ...overrides,
    },
    include: {
      teamMembers: true,
    },
  })
}
