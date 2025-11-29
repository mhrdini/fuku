import type { TRPCRouterRecord } from '@trpc/server'
import z from 'zod/v4'

import { protectedProcedure } from '../../trpc'

export const shiftTypeRouter = {
  getAllByTeam: protectedProcedure
    .input(
      z
        .object({
          teamId: z.string().optional(),
          teamSlug: z.string().optional(),
          limit: z.number().optional(),
        })
        .refine(data => data.teamId || data.teamSlug, {
          message: 'Either teamId or teamSlug must be provided',
        }),
    )
    .query(async ({ input, ctx }) => {
      const shiftTypes = await ctx.db.shiftType.findMany({
        where: {
          team: {
            ...(input.teamId ? { id: input.teamId } : {}),
            ...(input.teamSlug ? { slug: input.teamSlug } : {}),
          },
        },
        ...(input.limit && { take: input.limit }),
      })
      return shiftTypes
    }),
} satisfies TRPCRouterRecord
