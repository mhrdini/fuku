import { afterAll, afterEach, beforeAll } from 'vitest'

import {
  migrateTestDatabase,
  resetDatabase,
  testDb,
} from './database'

beforeAll(() => {
  migrateTestDatabase()
})

afterEach(async () => {
  await resetDatabase()
})

afterAll(async () => {
  await testDb.$disconnect()
})
