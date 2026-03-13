import { TRPCError, TRPCRouterRecord } from '@trpc/server'
import * as z from 'zod/v4'

import { protectedProcedure } from '../../trpc'

export const assignmentRouter = {
  list: protectedProcedure
    .input(
      z.object({
        teamId: z.string(),
        start: z.date(),
        end: z.date(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { teamId, start, end } = input

      const team = await ctx.db.team.findUnique({
        where: { id: teamId, deletedAt: null },
        select: {
          teamMembers: {
            where: { deletedAt: null },
            select: {
              id: true,
            },
          },
        },
      })

      if (!team) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `No team with id '${teamId}'`,
        })
      }

      // start and end dates already in UTC
      const assignments = await ctx.db.dayAssignment.findMany({
        where: {
          teamMemberId: { in: team.teamMembers.map(tm => tm.id) },
          date: {
            gte: start,
            lte: end,
          },
        },
      })

      return assignments
    }),
} satisfies TRPCRouterRecord
