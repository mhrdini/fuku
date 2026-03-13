import { TRPCRouterRecord } from '@trpc/server'
import * as z from 'zod/v4'

import { RuleConditionOutputSchema } from '../../schemas/ruleCondition'
import { protectedProcedure } from '../../trpc'
import { groupBy } from '../../utils/groupBy'

export const ruleConditionRouter = {
  groupByRules: protectedProcedure
    .input(
      z.object({
        ruleIds: z.string().array(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const conditions = await ctx.db.ruleCondition.findMany({
        where: {
          ruleId: {
            in: input.ruleIds,
          },
        },
      })

      const parsed = conditions.map(c => RuleConditionOutputSchema.parse(c))

      return groupBy(parsed, c => c.ruleId)
    }),
} satisfies TRPCRouterRecord
