import { resetDatabase } from '@fuku/db/testing'
import { test as base, expect } from '@playwright/test'

import { seedE2E, TEST_USER } from '../seed'

type Fixtures = {
  e2eDatabase: void
}

export const test = base.extend<Fixtures>({
  e2eDatabase: [async ({ page }, use) => {
    await resetDatabase()
    await seedE2E()

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

    await use()
  }, { auto: true }],
})

export { expect }
