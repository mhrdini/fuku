import { describe, expect, it } from 'vitest'

import { LeaveAssignmentSchema } from '../leave-assignment'

describe('leaveAssignmentSchema', () => {
  const valid = {
    id: '11111111-1111-1111-1111-111111111111',
    paid: true,
    dayAssignmentId: '22222222-2222-2222-2222-222222222222',
  }

  it('accepts a valid leave assignment', () => {
    const result = LeaveAssignmentSchema.parse(valid)

    expect(result).toEqual(valid)
  })

  it('accepts unpaid leave', () => {
    const result = LeaveAssignmentSchema.parse({
      ...valid,
      paid: false,
    })

    expect(result.paid).toBe(false)
  })

  it('rejects a non-boolean paid value', () => {
    expect(() =>
      LeaveAssignmentSchema.parse({
        ...valid,
        paid: 'true',
      }),
    ).toThrow()
  })

  it('rejects a missing day assignment ID', () => {
    expect(() =>
      LeaveAssignmentSchema.parse({
        ...valid,
        dayAssignmentId: undefined,
      }),
    ).toThrow()
  })
})
