import { createUser } from '@fuku/db/testing/factories'
import { describe, expect, it } from 'vitest'

import { createCaller } from '../helpers/caller'
import { createSessionContext } from '../helpers/context'

describe('auth router', () => {
  it('returns the current session', async () => {
    const user = await createUser({
      email: 'user@example.com',
    })

    const caller = createCaller({
      session: createSessionContext(user),
    })

    const session = await caller.auth.getSession()

    expect(session?.user.email).toBe('user@example.com')
  })

  it('allows an authenticated user to access the protected procedure', async () => {
    const user = await createUser()

    const caller = createCaller({
      session: createSessionContext(user),
    })

    await expect(caller.auth.getSecretMessage()).resolves.toBe(
      'You are logged in and can see this secret message!',
    )
  })

  it('rejects an unauthenticated user from the protected procedure', async () => {
    const caller = createCaller({
      session: null,
    })

    await expect(caller.auth.getSecretMessage()).rejects.toThrow()
  })
})
