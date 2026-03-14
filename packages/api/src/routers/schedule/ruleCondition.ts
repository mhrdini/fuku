import { TRPCRouterRecord } from '@trpc/server'
import * as z from 'zod/v4'

import {
  RuleConditionOutputSchema,
  RuleConditionUpdateInputSchema,
} from '../../schemas/ruleCondition'
import { protectedProcedure } from '../../trpc'
import { groupBy } from '../../utils/groupBy'

export const ruleConditionRouter = {
  groupByRules: protectedProcedure
    .input(
      z.object({
        teamId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const ruleIds = await ctx.db.rule
        .findMany({
          where: {
            teamId: input.teamId,
          },
          orderBy: {
            id: 'asc',
          },
          select: {
            id: true,
          },
        })
        .then(rules => rules.map(r => r.id))

      const conditions = await ctx.db.ruleCondition.findMany({
        where: {
          ruleId: {
            in: ruleIds,
          },
        },
      })

      const parsed = conditions.map(c => RuleConditionOutputSchema.parse(c))

      return groupBy(parsed, c => c.ruleId)
    }),

  update: protectedProcedure
    .input(RuleConditionUpdateInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      const updated = await ctx.db.ruleCondition.update({
        where: {
          id,
        },
        data,
      })

      return RuleConditionOutputSchema.parse(updated)
    }),
} satisfies TRPCRouterRecord
