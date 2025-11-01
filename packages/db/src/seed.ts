import { db } from './client'

// ---------------------
// Seed Data
// ---------------------
export const SHIFT_TYPES = [
  {
    name: 'AA',
    startTime: new Date('2025-01-01T07:00:00+09:00'),
    endTime: new Date('2025-01-01T16:00:00+09:00'),
    color: '#B71C1C',
  },
  {
    name: 'A',
    startTime: new Date('2025-01-01T07:30:00+09:00'),
    endTime: new Date('2025-01-01T16:30:00+09:00'),
    color: '#B71C1C',
  },
  {
    name: 'AB',
    startTime: new Date('2025-01-01T08:00:00+09:00'),
    endTime: new Date('2025-01-01T17:00:00+09:00'),
    color: '#B71C1C',
  },
  {
    name: 'B',
    startTime: new Date('2025-01-01T09:00:00+09:00'),
    endTime: new Date('2025-01-01T18:00:00+09:00'),
    color: '#1565C0',
  },
  {
    name: 'BA',
    startTime: new Date('2025-01-01T09:30:00+09:00'),
    endTime: new Date('2025-01-01T18:30:00+09:00'),
    color: '#1565C0',
  },
  {
    name: 'BB',
    startTime: new Date('2025-01-01T10:00:00+09:00'),
    endTime: new Date('2025-01-01T19:00:00+09:00'),
    color: '#1565C0',
  },
  {
    name: 'P',
    startTime: new Date('2025-01-01T13:00:00+09:00'),
    endTime: new Date('2025-01-01T18:30:00+09:00'),
    color: '#F1A24C',
  },
  {
    name: 'PAA',
    startTime: new Date('2025-01-01T08:00:00+09:00'),
    endTime: new Date('2025-01-01T13:00:00+09:00'),
    color: '#F1A24C',
  },
  {
    name: 'PA',
    startTime: new Date('2025-01-01T08:30:00+09:00'),
    endTime: new Date('2025-01-01T13:30:00+09:00'),
    color: '#F1A24C',
  },
  {
    name: 'PBB',
    startTime: new Date('2025-01-01T14:00:00+09:00'),
    endTime: new Date('2025-01-01T19:00:00+09:00'),
    color: '#F1A24C',
  },
]

// ---------------------
// Seed Function
// ---------------------
async function main() {
  for (const shiftType of SHIFT_TYPES) {
    await db.shiftType.upsert({
      where: { name: shiftType.name },
      update: {},
      create: shiftType,
    })
  }
}

// ---------------------
// Execute Seed Function
// ---------------------
main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
