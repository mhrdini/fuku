import { describe, expect, it } from 'vitest'

import { OperationalHourSchema } from '../operational-hour'

describe('operationalHourSchema', () => {
  const valid = {
    teamId: '11111111-1111-1111-1111-111111111111',
    weekday: 1,
    startTime: '09:00',
    endTime: '18:00',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    deletedAt: null,
    deletedById: null,
  }

  it('accepts a valid operational hour', () => {
    const result = OperationalHourSchema.parse(valid)

    expect(result.weekday).toBe(1)
    expect(result.startTime).toBe('09:00')
  })

  it('accepts the Sunday boundary', () => {
    const result = OperationalHourSchema.parse({
      ...valid,
      weekday: 7,
    })

    expect(result.weekday).toBe(7)
  })

  it('rejects a weekday below the boundary', () => {
    expect(() =>
      OperationalHourSchema.parse({
        ...valid,
        weekday: 0,
      }),
    ).toThrow()
  })

  it('rejects a weekday above the boundary', () => {
    expect(() =>
      OperationalHourSchema.parse({
        ...valid,
        weekday: 8,
      }),
    ).toThrow()
  })

  it('rejects an invalid start time', () => {
    expect(() =>
      OperationalHourSchema.parse({
        ...valid,
        startTime: '25:00',
      }),
    ).toThrow()
  })

  it('rejects an invalid end time', () => {
    expect(() =>
      OperationalHourSchema.parse({
        ...valid,
        endTime: '09:60',
      }),
    ).toThrow()
  })
})
