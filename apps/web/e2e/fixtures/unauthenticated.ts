import { resetDatabase } from '@fuku/db/testing'
import { test as base, expect } from '@playwright/test'

import { seedE2E } from '../seed'

type Fixtures = {
  e2eDatabase: void
}

export const test = base.extend<Fixtures>({
  // eslint-disable-next-line no-empty-pattern
  e2eDatabase: [async ({}, registerFixture) => {
    await resetDatabase()
    await seedE2E()

    await registerFixture()
  }, { auto: true }],
})

export { expect }
