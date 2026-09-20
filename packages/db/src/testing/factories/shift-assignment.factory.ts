import type { Prisma } from '@prisma/client'

import { testDb } from '../database'

export async function createShiftAssignment(
  dayAssignmentId: string,
  shiftTypeId: string,
  overrides: Partial<
    Omit<
      Prisma.ShiftAssignmentUncheckedCreateInput,
      'dayAssignmentId' | 'shiftTypeId'
    >
  > = {},
) {
  return testDb.shiftAssignment.create({
    data: {
      dayAssignmentId,
      shiftTypeId,
      ...overrides,
    },
  })
}
