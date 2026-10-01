import { testDb } from '@fuku/db/testing'

import type { Session } from '@fuku/auth'
import type { SchedulerService } from '@fuku/scheduling'

import { createTestAuthApi } from './auth'
import { createTestSchedulerService } from './scheduler'

// creates test tRPC context
export function createTestContext(
  options: {
    session?: Session | null
    schedulerService?: SchedulerService
  } = {},
) {
  const session = options.session ?? null

  return {
    authApi: createTestAuthApi(session),
    session,
    db: testDb,
    schedulerService:
      options.schedulerService ?? createTestSchedulerService(),
  }
}

// creates test tRPC session
export function createSessionContext(
  user: Session['user'],
): Session {
  const now = new Date()

  return {
    user,
    session: {
      id: 'test-session',
      userId: user.id,
      createdAt: now,
      updatedAt: now,
      expiresAt: new Date(now.getTime() + 60 * 60 * 1000),
      token: 'user-token',
    },
  }
}
