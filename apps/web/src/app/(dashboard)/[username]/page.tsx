import { redirect } from 'next/navigation'

import { getSession } from '~/auth/server'
import UserDashboard from '~/components/dashboard/content/dashboard'
import { HydrateClient, prefetch, trpc } from '~/trpc/server'

export default async function UserDashboardPage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const session = await getSession()

  if (!session || session.user.username !== username) {
    redirect('/login')
  } else {
    prefetch(trpc.user.byUsername.queryOptions({ username }))
  }

  return (
    <HydrateClient>
      <UserDashboard username={username} />
    </HydrateClient>
  )
}
