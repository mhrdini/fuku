import { describe, expect, it } from 'vitest'

import { ShiftAssignmentSchema } from '../shift-assignment'

describe('shiftAssignmentSchema', () => {
  const valid = {
    id: '11111111-1111-1111-1111-111111111111',
    locationId: null,
    shiftTypeId: '22222222-2222-2222-2222-222222222222',
    dayAssignmentId: '33333333-3333-3333-3333-333333333333',
  }

  it('accepts a valid shift assignment', () => {
    const result = ShiftAssignmentSchema.parse(valid)

    expect(result.shiftTypeId).toBe(valid.shiftTypeId)
    expect(result.locationId).toBeNullable()
  })

  it('accepts an optional location ID', () => {
    const result = ShiftAssignmentSchema.parse({
      ...valid,
      locationId: '44444444-4444-4444-4444-444444444444',
    })

    expect(result.locationId).toBe('44444444-4444-4444-4444-444444444444')
  })

  it('rejects a missing shift type ID', () => {
    expect(() =>
      ShiftAssignmentSchema.parse({
        ...valid,
        shiftTypeId: undefined,
      }),
    ).toThrow()
  })

  it('rejects a missing day assignment ID', () => {
    expect(() =>
      ShiftAssignmentSchema.parse({
        ...valid,
        dayAssignmentId: undefined,
      }),
    ).toThrow()
  })
})
