import { describe, expect, it } from 'vitest'

import { StaffingRequirementSchema } from './staffing-requirement'

describe('staffingRequirementSchema', () => {
  const valid = {
    teamId: '11111111-1111-1111-1111-111111111111',
    weekday: 1,
    minMembers: 1,
    maxMembers: 4,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  }

  it('accepts a valid staffing requirement', () => {
    const result = StaffingRequirementSchema.parse(valid)

    expect(result.minMembers).toBe(1)
    expect(result.maxMembers).toBe(4)
  })

  it('accepts zero members at the lower boundary', () => {
    const result = StaffingRequirementSchema.parse({
      ...valid,
      minMembers: 0,
      maxMembers: 0,
    })

    expect(result.minMembers).toBe(0)
    expect(result.maxMembers).toBe(0)
  })

  it('accepts the weekday boundary', () => {
    const result = StaffingRequirementSchema.parse({
      ...valid,
      weekday: 7,
    })

    expect(result.weekday).toBe(7)
  })

  it('rejects a negative minimum member count', () => {
    expect(() =>
      StaffingRequirementSchema.parse({
        ...valid,
        minMembers: -1,
      }),
    ).toThrow()
  })

  it('rejects a negative maximum member count', () => {
    expect(() =>
      StaffingRequirementSchema.parse({
        ...valid,
        maxMembers: -1,
      }),
    ).toThrow()
  })

  it('rejects a non-integer member count', () => {
    expect(() =>
      StaffingRequirementSchema.parse({
        ...valid,
        minMembers: 1.5,
      }),
    ).toThrow()
  })

  it('rejects a weekday outside the boundary', () => {
    expect(() =>
      StaffingRequirementSchema.parse({
        ...valid,
        weekday: 8,
      }),
    ).toThrow()
  })
})
