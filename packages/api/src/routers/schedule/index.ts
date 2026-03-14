import { TimeZoneSchema } from '@fuku/domain/schemas'
import { TRPCRouterRecord } from '@trpc/server'
import * as z from 'zod/v4'

import { protectedProcedure } from '../../trpc'

export const scheduleRouter = {
  generateMonthly: protectedProcedure
    .input(
      z.object({
        teamId: z.string(),
        start: z.date(),
        end: z.date(),
        timeZone: TimeZoneSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.schedulerService.generateMonthly(input)
      return result
    }),
} satisfies TRPCRouterRecord
