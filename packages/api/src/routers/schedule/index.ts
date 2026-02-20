import { TRPCRouterRecord } from '@trpc/server'
import z from 'zod/v4'

import { protectedProcedure } from '../../trpc'

export const scheduleRouter = {
  generateMonthly: protectedProcedure
    .input(
      z.object({
        teamId: z.string(),
        year: z.number(),
        month: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const team = await ctx.db.team.findUnique({
        where: { id: input.teamId },
        select: { timeZone: true },
      })

      if (!team) {
        throw new Error('Team not found')
      }

      const timeZone = team.timeZone

      const result = await ctx.schedulerService.generateMonthly({
        ...input,
        timeZone,
      })
      return result
    }),
} satisfies TRPCRouterRecord
