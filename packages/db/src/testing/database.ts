import { PrismaPg } from '@prisma/adapter-pg'
import { Prisma, PrismaClient } from '@prisma/client'
import { execSync } from 'node:child_process'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is required for database tests')
}

const globalForPrisma = globalThis as unknown as {
  testDb?: PrismaClient
}

export const testDb
  = globalForPrisma.testDb
    ?? new PrismaClient({
      adapter: new PrismaPg({ connectionString }),
    })

globalForPrisma.testDb = testDb

export function migrateTestDatabase() {
  execSync('pnpm --filter @fuku/db exec prisma migrate deploy', {
    env: process.env,
    stdio: 'inherit',
  })
}

const tableNames = [
  'ShiftAssignment',
  'DayAssignment',
  'Unavailability',
  'Rule',
  'StaffingRequirement',
  'OperationalHour',
  'ShiftType',
  'PayGrade',
  'Location',
  'TeamMember',
  'Team',
  'Session',
  'User',
]

export async function resetDatabase() {
  await testDb.$transaction(
    tableNames.map(name =>
      testDb.$executeRawUnsafe(`TRUNCATE TABLE "${name}" CASCADE;`),
    ),
  )
}

export { Prisma }
