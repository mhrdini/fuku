import type { PrismaClient } from '@fuku/db'

import { TeamOutputSchema } from '../schemas'

export async function resolveActiveTeam({ db, userId }: { db: PrismaClient, userId: string }) {
  const user = await db.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      lastActiveTeamId: true,
    },
  })

  if (user?.lastActiveTeamId) {
    const activeTeam = await db.team.findFirst({
      where: {
        id: user.lastActiveTeamId,
        deletedAt: null,
        teamMembers: {
          some: {
            userId,
            deletedAt: null,
          },
        },
      },
    })

    if (activeTeam) {
      return TeamOutputSchema.parse(activeTeam)
    }
  }

  const nextTeam = await db.team.findFirst({
    where: {
      deletedAt: null,
      teamMembers: {
        some: {
          userId,
          deletedAt: null,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  })

  await db.user.update({
    where: {
      id: userId,
    },
    data: {
      lastActiveTeamId: nextTeam?.id ?? null,
    },
  })

  return nextTeam ? TeamOutputSchema.parse(nextTeam) : null
}
