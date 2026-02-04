import { db } from '@fuku/db'

import { getSession } from '~/auth/server'
import UserDashboard from '~/components/dashboard/user-dashboard'

export default async function UserDashboardPage() {
  const session = await getSession()

  if (!session) return null

  const user = await db.user.findFirst({
    where: { username: session.user.username },
  })

  if (!user) return null

  return <UserDashboard user={user} />
}
