import { resetDatabase } from '@fuku/db/testing'
import { createTeam } from '@fuku/db/testing/factories'
import { test as base, expect } from '@playwright/test'

import { seedE2E, TEST_USER } from '../seed'

type Fixtures = {
  authenticatedUser: Awaited<ReturnType<typeof seedE2E>>
  team: Awaited<ReturnType<typeof createTeam>>
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

  team: async ({ authenticatedUser }, registerFixture) => {
    const team = await createTeam(authenticatedUser.id)

    await registerFixture(team)
  },
})

export { expect }
