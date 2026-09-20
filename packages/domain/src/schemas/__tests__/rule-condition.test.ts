import { describe, expect, it } from 'vitest'

import { RuleConditionSchema } from '../rule-condition'

describe('ruleConditionSchema', () => {
  const validMonthCondition = {
    id: '11111111-1111-1111-1111-111111111111',
    ruleId: '22222222-2222-2222-2222-222222222222',
    field: 'MONTH' as const,
    operator: 'EQ' as const,
    value: 1,
  }

  it('accepts a valid month condition', () => {
    const result = RuleConditionSchema.parse(validMonthCondition)

    expect(result.field).toBe('MONTH')
    expect(result.value).toBe(1)
  })

  it('accepts a month condition with multiple values', () => {
    const result = RuleConditionSchema.parse({
      ...validMonthCondition,
      operator: 'IN',
      value: [1, 2, 3],
    })

    expect(result.value).toEqual([1, 2, 3])
  })

  it('accepts the IS_HOLIDAY default value', () => {
    const result = RuleConditionSchema.parse({
      id: validMonthCondition.id,
      ruleId: validMonthCondition.ruleId,
      field: 'IS_HOLIDAY',
      operator: 'EQ',
    })

    expect(result.value).toBe(true)
  })

  it('rejects an invalid month operator', () => {
    expect(() =>
      RuleConditionSchema.parse({
        ...validMonthCondition,
        operator: 'INVALID',
      }),
    ).toThrow()
  })

  it('rejects a non-boolean holiday value', () => {
    expect(() =>
      RuleConditionSchema.parse({
        ...validMonthCondition,
        field: 'IS_HOLIDAY',
        operator: 'EQ',
        value: 1,
      }),
    ).toThrow()
  })
})
