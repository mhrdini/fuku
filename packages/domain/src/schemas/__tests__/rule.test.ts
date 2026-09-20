import { describe, expect, it } from 'vitest'

import { RuleSchema } from '../rule'

describe('ruleSchema', () => {
  const valid = {
    id: '11111111-1111-1111-1111-111111111111',
    teamId: '22222222-2222-2222-2222-222222222222',
    scope: 'GLOBAL' as const,
    payGradeId: null,
    shiftTypeId: null,
    teamMemberId: null,
    metric: 'DAYS_WORKED' as const,
    timeWindow: 'PER_WEEK' as const,
    operator: 'MAX' as const,
    threshold: 5,
    hardConstraint: false,
  }

  it('accepts a valid global rule and applies the active default', () => {
    const result = RuleSchema.parse(valid)

    expect(result.scope).toBe('GLOBAL')
    expect(result.active).toBe(false)
  })

  it('accepts a zero penalty', () => {
    const result = RuleSchema.parse({
      ...valid,
      penalty: 0,
    })

    expect(result.penalty).toBe(0)
  })

  it('rejects a negative penalty', () => {
    expect(() =>
      RuleSchema.parse({
        ...valid,
        penalty: -1,
      }),
    ).toThrow()
  })

  it('rejects an invalid scope', () => {
    expect(() =>
      RuleSchema.parse({
        ...valid,
        scope: 'INVALID',
      }),
    ).toThrow()
  })

  it('rejects an invalid metric', () => {
    expect(() =>
      RuleSchema.parse({
        ...valid,
        metric: 'INVALID',
      }),
    ).toThrow()
  })
})
