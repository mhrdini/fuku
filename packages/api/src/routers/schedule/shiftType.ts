import type { TRPCRouterRecord } from '@trpc/server'
import z from 'zod/v4'

import { protectedProcedure } from '../../trpc'

export const shiftTypeRouter = {
  getAllByTeam: protectedProcedure
    .input(
      z.object({
        teamId: z.string(),
        limit: z.number().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const shiftTypes = await ctx.db.shiftType.findMany({
        where: {
          team: {
            id: input.teamId,
          },
        },
        ...(input.limit && { take: input.limit }),
      })
      return shiftTypes
    }),
} satisfies TRPCRouterRecord
