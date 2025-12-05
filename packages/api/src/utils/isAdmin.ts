import { TRPCError } from '@trpc/server'

import { TRPCContext } from '../trpc'

interface CheckAdminInput {
  ctx: TRPCContext
  teamId?: string
  teamSlug?: string
}

export async function assertUserIsTeamAdmin({
  ctx,
  teamId,
  teamSlug,
}: CheckAdminInput) {
  if (!teamId && !teamSlug) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Either teamId or teamSlug must be provided',
    })
  }

  const isAdmin = await ctx.db.team.count({
    where: {
      deletedAt: null,
      adminUsers: { some: { id: ctx.session?.user.id } },
      ...(teamId ? { id: teamId } : {}),
      ...(teamSlug ? { slug: teamSlug } : {}),
    },
  })

  if (!isAdmin) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You do not have permission to perform this action on this team',
    })
  }
}
