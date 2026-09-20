import { describe, expect, it } from 'vitest'

import { UserSchema } from './user'

describe('userSchema', () => {
  const valid = {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    emailVerified: true,
    image: null,
    username: 'jane-smith',
    displayUsername: 'Jane Smith',
    lastActiveTeamId: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  }

  it('accepts a valid user', () => {
    const result = UserSchema.parse(valid)

    expect(result.name).toBe('Jane Smith')
    expect(result.email).toBe('jane.smith@example.com')
  })

  it('accepts the minimum username length', () => {
    const result = UserSchema.parse({
      ...valid,
      username: 'jan',
    })

    expect(result.username).toBe('jan')
  })

  it('accepts the maximum username length', () => {
    const username = 'a'.repeat(30)

    const result = UserSchema.parse({
      ...valid,
      username,
    })

    expect(result.username).toBe(username)
  })

  it('rejects an empty name', () => {
    expect(() =>
      UserSchema.parse({
        ...valid,
        name: '',
      }),
    ).toThrow()
  })

  it('rejects a username shorter than three characters', () => {
    expect(() =>
      UserSchema.parse({
        ...valid,
        username: 'ja',
      }),
    ).toThrow()
  })

  it('rejects a username longer than thirty characters', () => {
    expect(() =>
      UserSchema.parse({
        ...valid,
        username: 'a'.repeat(31),
      }),
    ).toThrow()
  })

  it('rejects invalid username characters', () => {
    expect(() =>
      UserSchema.parse({
        ...valid,
        username: 'jane smith',
      }),
    ).toThrow()
  })

  it('rejects a malformed email', () => {
    expect(() =>
      UserSchema.parse({
        ...valid,
        email: 'not-an-email',
      }),
    ).toThrow()
  })
})
