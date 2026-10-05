import { afterAll, afterEach, beforeAll } from 'vitest'

import {
  migrateTestDatabase,
  resetDatabase,
  testDb,
} from './database'

beforeAll(async () => {
  await migrateTestDatabase()
})

afterEach(async () => {
  await resetDatabase()
})

afterAll(async () => {
  await testDb.$disconnect()
})
