import { faker } from '@faker-js/faker'

import type { Prisma } from '@prisma/client'

import { testDb } from '../database'

export async function createStaffingRequirement(
  teamId: string,
  weekday: number,
  overrides: Partial<
    Omit<
      Prisma.StaffingRequirementUncheckedCreateInput,
      'teamId' | 'weekday'
    >
  > = {},
) {
  const minMembers = faker.number.int({ min: 1, max: 3 })

  return testDb.staffingRequirement.create({
    data: {
      weekday,
      teamId,
      minMembers,
      maxMembers: faker.number.int({
        min: minMembers,
        max: 6,
      }),
      ...overrides,
    },
  })
}
