import { faker } from '@faker-js/faker'

export function formatTime(hour: number) {
  return `${hour.toString().padStart(2, '0')}:00`
}

export function generateTimeRange(): { startTime: string, endTime: string } {
  const startHour = faker.number.int({ min: 0, max: 22 })
  const endHour = faker.number.int({
    min: startHour + 1,
    max: 23,
  })

  const startTime = formatTime(startHour)
  const endTime = formatTime(endHour)

  return {
    startTime,
    endTime,
  }
}
