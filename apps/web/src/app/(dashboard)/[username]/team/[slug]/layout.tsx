import { redirect } from 'next/navigation'
import { db } from '@fuku/db'

import { getSession } from '~/auth/server'
import { prefetch, trpc } from '~/trpc/server'

export default async function TeamLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ username: string; slug: string }>
}) {
  const session = await getSession()
  const { username, slug } = await params
  if (!session || session.user.username !== username) redirect(`/login`)

  const team = await db.team.findFirst({
    where: {
      slug: slug,
      teamMembers: {
        some: { userId: session.user.id },
      },
    },
  })

  if (!team) {
    // notFound()
    // console.log()
    redirect(`/${username}`)
  }

  await db.user.update({
    where: { id: session.user.id },
    data: { lastActiveTeamId: team.id },
  })

  prefetch({ ...trpc.team.bySlug.queryOptions({ slug }), initialData: team })

  return <>{children}</>
}
