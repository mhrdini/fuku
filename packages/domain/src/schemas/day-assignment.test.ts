import { describe, expect, it } from 'vitest'

import { DayAssignmentSchema } from './day-assignment'

describe('dayAssignmentSchema', () => {
  const valid = {
    id: '11111111-1111-1111-1111-111111111111',
    date: new Date('2026-01-15'),
    teamMemberId: '22222222-2222-2222-2222-222222222222',
  }

  it('accepts a minimal valid day assignment', () => {
    const result = DayAssignmentSchema.parse(valid)

    expect(result.id).toBe(valid.id)
    expect(result.date).toEqual(valid.date)
    expect(result.teamMemberId).toBe(valid.teamMemberId)
  })

  it('accepts a day assignment with a shift assignment', () => {
    const result = DayAssignmentSchema.parse({
      ...valid,
      shiftAssignment: {
        id: '33333333-3333-3333-3333-333333333333',
        shiftTypeId: '44444444-4444-4444-4444-444444444444',
        dayAssignmentId: valid.id,
      },
    })

    expect(result.shiftAssignment).toBeDefined()
  })

  it('accepts a day assignment with a leave assignment', () => {
    const result = DayAssignmentSchema.parse({
      ...valid,
      leaveAssignment: {
        id: '55555555-5555-5555-5555-555555555555',
        paid: true,
        dayAssignmentId: valid.id,
      },
    })

    expect(result.leaveAssignment).toBeDefined()
  })

  it('rejects an invalid date', () => {
    expect(() =>
      DayAssignmentSchema.parse({
        ...valid,
        date: 'not-a-date',
      }),
    ).toThrow()
  })

  it('rejects a missing team member ID', () => {
    expect(() =>
      DayAssignmentSchema.parse({
        ...valid,
        teamMemberId: undefined,
      }),
    ).toThrow()
  })
})
