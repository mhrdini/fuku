import { db } from '@fuku/db'
import { resetDatabase } from '@fuku/db/testing'
import { createTeam } from '@fuku/db/testing/factories'
import { test as base, expect } from '@playwright/test'

import { seedE2E, TEST_USER } from '../seed'

type Fixtures = {
  authenticatedUser: Awaited<ReturnType<typeof seedE2E>>
  teams: Array<Awaited<ReturnType<typeof createTeam>>>
}

export const test = base.extend<Fixtures>({
  authenticatedUser: [async ({ page }, registerFixture) => {
    await resetDatabase()

    const user = await seedE2E()

    const response = await page.request.post('/api/auth/sign-in/username', {
      data: {
        username: TEST_USER.username,
        password: TEST_USER.password,
      },
    })

    if (!response.ok()) {
      throw new Error(
        `Failed to authenticate E2E user: ${response.status()} ${await response.text()}`,
      )
    }

    await registerFixture(user)
  }, { auto: true }],

  teams: async ({ authenticatedUser }, registerFixture) => {
    const teamB = await createTeam(authenticatedUser.id)
    const teamA = await createTeam(authenticatedUser.id)

    await db.user.update({
      where: {
        id: authenticatedUser.id,
      },
      data: {
        lastActiveTeamId: teamA.id,
      },
    })

    await registerFixture([teamA, teamB])
  },
})

export { expect }
