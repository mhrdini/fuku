import { faker } from '@faker-js/faker'

import type { Prisma } from '../../generated/prisma/client'

import { testDb } from '../database'

export async function createTeamMember(
  teamId: string,
  overrides: Partial<
    Omit<Prisma.TeamMemberUncheckedCreateInput, 'teamId'>
  > = {},
) {
  return testDb.teamMember.create({
    data: {
      familyName: faker.person.lastName(),
      givenNames: faker.person.firstName(),
      teamId,
      ...overrides,
    },
    include: { payGrade: true, user: true },
  })
}
