import { TRPCRouterRecord } from '@trpc/server'
import z from 'zod/v4'

import { protectedProcedure } from '../../trpc'

export const RuleRouter = {
  byPayGrade: protectedProcedure
    .input(
      z.object({
        payGradeId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const rules = await ctx.db.rule.findMany({
        where: {
          payGradeId: input.payGradeId,
        },
      })
      return rules
    }),
} satisfies TRPCRouterRecord
