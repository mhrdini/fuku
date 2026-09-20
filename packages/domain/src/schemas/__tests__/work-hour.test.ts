import { describe, expect, it } from 'vitest'

import { WorkHourSchema } from '../work-hour'

describe('workHourSchema', () => {
  const valid = {
    id: '11111111-1111-1111-1111-111111111111',
    shiftAssignmentId: '22222222-2222-2222-2222-222222222222',
    actualStart: new Date('2026-01-15T09:00:00Z'),
    actualEnd: new Date('2026-01-15T17:00:00Z'),
    rateMultiplier: 1,
    breakMinutes: 60,
  }

  it('accepts a valid work hour', () => {
    const result = WorkHourSchema.parse(valid)

    expect(result.actualStart).toEqual(valid.actualStart)
    expect(result.actualEnd).toEqual(valid.actualEnd)
  })

  it('accepts zero rate multiplier', () => {
    const result = WorkHourSchema.parse({
      ...valid,
      rateMultiplier: 0,
    })

    expect(result.rateMultiplier).toBe(0)
  })

  it('accepts zero break minutes', () => {
    const result = WorkHourSchema.parse({
      ...valid,
      breakMinutes: 0,
    })

    expect(result.breakMinutes).toBe(0)
  })

  it('accepts optional calculated hours', () => {
    const result = WorkHourSchema.parse({
      ...valid,
      calculatedHours: 7,
    })

    expect(result.calculatedHours).toBe(7)
  })

  it('rejects a missing shift assignment ID', () => {
    expect(() =>
      WorkHourSchema.parse({
        ...valid,
        shiftAssignmentId: undefined,
      }),
    ).toThrow()
  })

  it('rejects an invalid actual start date', () => {
    expect(() =>
      WorkHourSchema.parse({
        ...valid,
        actualStart: '2026-01-15T09:00:00Z',
      }),
    ).toThrow()
  })

  it('rejects a non-numeric rate multiplier', () => {
    expect(() =>
      WorkHourSchema.parse({
        ...valid,
        rateMultiplier: '1',
      }),
    ).toThrow()
  })
})
