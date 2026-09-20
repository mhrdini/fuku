import { describe, expect, it } from 'vitest'

import { TeamMemberSchema } from './team-member'

describe('teamMemberSchema', () => {
  const valid = {
    id: '11111111-1111-1111-1111-111111111111',
    userId: null,
    familyName: 'Smith',
    givenNames: 'Jane',
    teamId: '22222222-2222-2222-2222-222222222222',
    payGradeId: null,
    teamMemberRole: 'STAFF' as const,
    rateMultiplier: 1,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    deletedAt: null,
    deletedById: null,
  }

  it('accepts a valid team member', () => {
    const result = TeamMemberSchema.parse(valid)

    expect(result.givenNames).toBe('Jane')
    expect(result.familyName).toBe('Smith')
  })

  it('accepts a zero rate multiplier', () => {
    const result = TeamMemberSchema.parse({
      ...valid,
      rateMultiplier: 0,
    })

    expect(result.rateMultiplier).toBe(0)
  })

  it('accepts an admin team member', () => {
    const result = TeamMemberSchema.parse({
      ...valid,
      teamMemberRole: 'ADMIN',
    })

    expect(result.teamMemberRole).toBe('ADMIN')
  })

  it('rejects empty given names', () => {
    expect(() =>
      TeamMemberSchema.parse({
        ...valid,
        givenNames: '',
      }),
    ).toThrow()
  })

  it('rejects a negative rate multiplier', () => {
    expect(() =>
      TeamMemberSchema.parse({
        ...valid,
        rateMultiplier: -1,
      }),
    ).toThrow()
  })

  it('rejects an invalid team member role', () => {
    expect(() =>
      TeamMemberSchema.parse({
        ...valid,
        teamMemberRole: 'MANAGER',
      }),
    ).toThrow()
  })

  it('rejects an invalid colour', () => {
    expect(() =>
      TeamMemberSchema.parse({
        ...valid,
        color: '#FFF',
      }),
    ).toThrow()
  })
})
