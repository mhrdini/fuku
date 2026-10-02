import { db } from '@fuku/db'

const TEST_USER = {
  name: 'Test User',
  username: 'testuser',
  email: 'test@example.com',
  password: 'testuser',
} as const

export async function seedE2E() {
  const existingUser = await db.user.findUnique({
    where: {
      email: TEST_USER.email,
    },
  })

  if (existingUser) {
    return
  }

  const response = await fetch(
    'http://localhost:3000/api/auth/sign-up/email',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(TEST_USER),
    },
  )

  if (!response.ok) {
    const body = await response.text()

    throw new Error(
      `Failed to seed E2E user: ${response.status} ${body}`,
    )
  }
}
