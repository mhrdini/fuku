import { testDb } from '../database'

export async function createPayGradeShiftType(
  payGradeId: string,
  shiftTypeId: string,
) {
  return testDb.payGradeShiftType.create({
    data: {
      payGradeId,
      shiftTypeId,
    },
  })
}
