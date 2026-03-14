import { Prisma } from '@fuku/db'
import { TRPCRouterRecord } from '@trpc/server'
import * as z from 'zod/v4'

import {
  RuleConditionCreateInputSchema,
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

  create: protectedProcedure
    .input(RuleConditionCreateInputSchema)
    .mutation(async ({ ctx, input }) => {
      const created = await ctx.db.ruleCondition.create({
        data: {
          ...input,
          ...(input.value === null || input.value === undefined
            ? { value: Prisma.DbNull }
            : { value: input.value }),
        },
      })

      return RuleConditionOutputSchema.parse(created)
    }),

  update: protectedProcedure
    .input(RuleConditionUpdateInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input

      const updated = await ctx.db.ruleCondition.update({
        where: {
          id,
        },
        data: {
          ...data,
          ...(data.value === null || data.value === undefined
            ? { value: Prisma.DbNull }
            : { value: data.value }),
        },
      })

      return RuleConditionOutputSchema.parse(updated)
    }),

  delete: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id } = input

      const deleted = await ctx.db.ruleCondition.delete({
        where: {
          id,
        },
      })

      return RuleConditionOutputSchema.parse(deleted)
    }),
} satisfies TRPCRouterRecord
