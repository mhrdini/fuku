import { faker } from '@faker-js/faker'

import type { Prisma } from '../../generated/prisma/client'

import { testDb } from '../database'

export async function createLeaveAssignment(
  dayAssignmentId: string,
  overrides: Partial<
    Omit<Prisma.LeaveAssignmentUncheckedCreateInput, 'dayAssignmentId'>
  > = {},
) {
  return testDb.leaveAssignment.create({
    data: {
      dayAssignmentId,
      paid: faker.datatype.boolean(),
      ...overrides,
    },
  })
}
