import { migrateTestDatabase } from '@fuku/db/testing'
import { test as setup } from '@playwright/test'

setup('migrate test database', async () => {
  await migrateTestDatabase()
})
