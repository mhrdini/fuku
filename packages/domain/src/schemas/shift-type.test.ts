import { describe, expect, it } from 'vitest'

import { ShiftTypeSchema } from './shift-type'

describe('shiftTypeSchema', () => {
  const valid = {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Morning Shift',
    description: null,
    startTime: '09:00',
    endTime: '17:00',
    teamId: '22222222-2222-2222-2222-222222222222',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    deletedAt: null,
    deletedById: null,
  }

  it('accepts a minimal valid shift type', () => {
    const result = ShiftTypeSchema.parse(valid)

    expect(result.name).toBe('Morning Shift')
    expect(result.startTime).toBe('09:00')
  })

  it('accepts optional fields', () => {
    const result = ShiftTypeSchema.parse({
      ...valid,
      description: 'Regular morning shift',
      color: '#AABBCC',
      allowedWeekdays: [1, 2, 3, 4, 5],
    })

    expect(result.description).toBe('Regular morning shift')
    expect(result.color).toBe('#AABBCC')
    expect(result.allowedWeekdays).toEqual([1, 2, 3, 4, 5])
  })

  it('accepts the weekday boundaries', () => {
    const result = ShiftTypeSchema.parse({
      ...valid,
      allowedWeekdays: [1, 7],
    })

    expect(result.allowedWeekdays).toEqual([1, 7])
  })

  it('rejects an empty shift type name', () => {
    expect(() =>
      ShiftTypeSchema.parse({
        ...valid,
        name: '',
      }),
    ).toThrow()
  })

  it('rejects an invalid time', () => {
    expect(() =>
      ShiftTypeSchema.parse({
        ...valid,
        startTime: '25:00',
      }),
    ).toThrow()
  })

  it('rejects a weekday outside the boundary', () => {
    expect(() =>
      ShiftTypeSchema.parse({
        ...valid,
        allowedWeekdays: [8],
      }),
    ).toThrow()
  })

  it('rejects a non-integer weekday', () => {
    expect(() =>
      ShiftTypeSchema.parse({
        ...valid,
        allowedWeekdays: [1.5],
      }),
    ).toThrow()
  })
})
