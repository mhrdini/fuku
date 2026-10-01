import { describe, expect, it } from 'vitest'

import { PayGradeSchema } from './pay-grade'

describe('payGradeSchema', () => {
  const valid = {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Barista',
    description: null,
    baseRate: 1200,
    teamId: '22222222-2222-2222-2222-222222222222',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  }

  it('accepts a valid pay grade', () => {
    const result = PayGradeSchema.parse(valid)

    expect(result.name).toBe('Barista')
    expect(result.baseRate).toBe(1200)
  })

  it('accepts a zero base rate', () => {
    const result = PayGradeSchema.parse({
      ...valid,
      baseRate: 0,
    })

    expect(result.baseRate).toBe(0)
  })

  it('rejects an empty pay grade name', () => {
    expect(() =>
      PayGradeSchema.parse({
        ...valid,
        name: '',
      }),
    ).toThrow()
  })

  it('rejects a negative base rate', () => {
    expect(() =>
      PayGradeSchema.parse({
        ...valid,
        baseRate: -1,
      }),
    ).toThrow()
  })

  it('rejects a non-numeric base rate', () => {
    expect(() =>
      PayGradeSchema.parse({
        ...valid,
        baseRate: '1200',
      }),
    ).toThrow()
  })
})
