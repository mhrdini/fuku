import { describe, expect, it } from 'vitest'

import { PayGradeShiftTypeSchema } from '../pay-grade-shift-type'

describe('payGradeShiftTypeSchema', () => {
  const valid = {
    payGradeId: '11111111-1111-1111-1111-111111111111',
    shiftTypeId: '22222222-2222-2222-2222-222222222222',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    deletedAt: null,
    deletedById: null,
  }

  it('accepts a valid pay grade shift type', () => {
    const result = PayGradeShiftTypeSchema.parse(valid)

    expect(result.payGradeId).toBe(valid.payGradeId)
    expect(result.shiftTypeId).toBe(valid.shiftTypeId)
  })

  it('rejects a missing pay grade ID', () => {
    expect(() =>
      PayGradeShiftTypeSchema.parse({
        ...valid,
        payGradeId: undefined,
      }),
    ).toThrow()
  })

  it('rejects a missing shift type ID', () => {
    expect(() =>
      PayGradeShiftTypeSchema.parse({
        ...valid,
        shiftTypeId: undefined,
      }),
    ).toThrow()
  })
})
