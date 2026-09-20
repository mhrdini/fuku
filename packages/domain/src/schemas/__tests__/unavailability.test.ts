import { describe, expect, it } from 'vitest'

import { UnavailabilitySchema } from '../unavailability'

describe('unavailabilitySchema', () => {
  const valid = {
    id: '11111111-1111-1111-1111-111111111111',
    teamMemberId: '22222222-2222-2222-2222-222222222222',
    date: new Date('2026-01-15'),
  }

  it('accepts a minimal valid unavailability', () => {
    const result = UnavailabilitySchema.parse(valid)

    expect(result.teamMemberId).toBe(valid.teamMemberId)
    expect(result.date).toEqual(valid.date)
  })

  it('accepts an optional reason', () => {
    const result = UnavailabilitySchema.parse({
      ...valid,
      reason: 'Annual leave',
    })

    expect(result.reason).toBe('Annual leave')
  })

  it('accepts an empty reason', () => {
    const result = UnavailabilitySchema.parse({
      ...valid,
      reason: '',
    })

    expect(result.reason).toBe('')
  })

  it('rejects an invalid date', () => {
    expect(() =>
      UnavailabilitySchema.parse({
        ...valid,
        date: '2026-01-15',
      }),
    ).toThrow()
  })

  it('rejects a missing team member ID', () => {
    expect(() =>
      UnavailabilitySchema.parse({
        ...valid,
        teamMemberId: undefined,
      }),
    ).toThrow()
  })
})
