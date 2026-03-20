import {
  GenerateScheduleInputSchema,
  GenerateScheduleOutputSchema,
} from '@fuku/domain/schemas'
import { TRPCRouterRecord } from '@trpc/server'

import { protectedProcedure } from '../../trpc'

export const scheduleRouter = {
  generate: protectedProcedure
    .input(GenerateScheduleInputSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.schedulerService.generate(input)
      return GenerateScheduleOutputSchema.parse(result)
    }),
} satisfies TRPCRouterRecord
