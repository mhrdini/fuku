import { describe, expect, it } from 'vitest'

import { LocationSchema } from '../location'

describe('locationSchema', () => {
  const valid = {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Main Café',
    address: null,
    teamId: '22222222-2222-2222-2222-222222222222',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    deletedAt: null,
    deletedById: null,
  }

  it('accepts a minimal valid location', () => {
    const result = LocationSchema.parse(valid)

    expect(result.name).toBe('Main Café')
  })

  it('accepts a valid hex colour', () => {
    const result = LocationSchema.parse({
      ...valid,
      color: '#AABBCC',
    })

    expect(result.color).toBe('#AABBCC')
  })

  it('rejects an empty location name', () => {
    expect(() =>
      LocationSchema.parse({
        ...valid,
        name: '',
      }),
    ).toThrow()
  })

  it('rejects an invalid hex colour', () => {
    expect(() =>
      LocationSchema.parse({
        ...valid,
        color: 'red',
      }),
    ).toThrow()
  })

  it('rejects a hex colour with the wrong length', () => {
    expect(() =>
      LocationSchema.parse({
        ...valid,
        color: '#FFF',
      }),
    ).toThrow()
  })
})
