import { describe, expect, it } from 'vitest'

import { TeamSchema } from '../team'

describe('teamSchema', () => {
  const valid = {
    id: '11111111-1111-1111-1111-111111111111',
    slug: 'main-cafe',
    name: 'Main Café',
    description: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    deletedAt: null,
    deletedById: null,
    timeZone: 'Asia/Tokyo',
    country: 'JP',
  }

  it('accepts a valid team', () => {
    const result = TeamSchema.parse(valid)

    expect(result.name).toBe('Main Café')
    expect(result.timeZone).toBe('Asia/Tokyo')
  })

  it('accepts a team without optional description or country', () => {
    const result = TeamSchema.parse({
      ...valid,
      description: undefined,
      country: undefined,
    })

    expect(result.description).toBeUndefined()
    expect(result.country).toBeUndefined()
  })

  it('accepts UTC as a valid time zone', () => {
    const result = TeamSchema.parse({
      ...valid,
      timeZone: 'UTC',
    })

    expect(result.timeZone).toBe('UTC')
  })

  it('rejects an empty team name', () => {
    expect(() =>
      TeamSchema.parse({
        ...valid,
        name: '',
      }),
    ).toThrow()
  })

  it('rejects an invalid time zone', () => {
    expect(() =>
      TeamSchema.parse({
        ...valid,
        timeZone: 'Not/A_Timezone',
      }),
    ).toThrow()
  })

  it('rejects an invalid country code', () => {
    expect(() =>
      TeamSchema.parse({
        ...valid,
        country: 'XX',
      }),
    ).toThrow()
  })
})
