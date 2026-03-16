import { TimeZoneSchema } from '@fuku/domain/schemas'
import { TRPCRouterRecord } from '@trpc/server'
import * as z from 'zod/v4'

import { GenerateScheduleOutputSchema } from '../../schemas'
import { protectedProcedure } from '../../trpc'

export const scheduleRouter = {
  generate: protectedProcedure
    .input(
      z.object({
        teamId: z.string(),
        start: z.date(),
        end: z.date(),
        timeZone: TimeZoneSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.schedulerService.generate(input)
      return GenerateScheduleOutputSchema.parse(result)
    }),
} satisfies TRPCRouterRecord
