import { redirect } from 'next/navigation'

import { db } from '@fuku/db'

import { getSession } from '~/auth/server'

export default async function TeamLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ username: string, publicId: string }>
}) {
  const session = await getSession()
  const { username, publicId } = await params

  if (!session || session.user.username !== username) {
    redirect('/login')
  }

  const team = await db.team.findFirst({
    where: {
      publicId,
      deletedAt: null,
      teamMembers: {
        some: {
          userId: session.user.id,
          deletedAt: null,
        },
      },
    },
  })

  if (!team) {
    redirect(`/${username}`)
  }

  await db.user.update({
    where: { id: session.user.id },
    data: { lastActiveTeamId: team.id },
  })

  return <>{children}</>
}
