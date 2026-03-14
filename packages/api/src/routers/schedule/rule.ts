import { TRPCRouterRecord } from '@trpc/server'
import * as z from 'zod/v4'

import {
  RuleCreateInputSchema,
  RuleOutput,
  RuleUpdateInputSchema,
} from '../../schemas'
import { protectedProcedure } from '../../trpc'

export const ruleRouter = {
  list: protectedProcedure
    .input(
      z.object({
        teamId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const rules = await ctx.db.rule.findMany({
        where: {
          teamId: input.teamId,
        },
      })
      return rules
    }),

  groupById: protectedProcedure
    .input(
      z.object({
        teamId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const rules = await ctx.db.rule.findMany({
        where: {
          teamId: input.teamId,
        },
        orderBy: {
          id: 'asc',
        },
      })

      return rules.reduce(
        (acc, rule) => {
          acc[rule.id] = rule
          return acc
        },
        {} as Record<string, RuleOutput>,
      )
    }),
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
  byShiftType: protectedProcedure
    .input(
      z.object({
        shiftTypeId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const rules = await ctx.db.rule.findMany({
        where: {
          shiftTypeId: input.shiftTypeId,
        },
      })
      return rules
    }),
  byTeamMember: protectedProcedure
    .input(
      z.object({
        teamMemberId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const rules = await ctx.db.rule.findMany({
        where: {
          teamMemberId: input.teamMemberId,
        },
      })
      return rules
    }),
  create: protectedProcedure
    .input(RuleCreateInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { ruleConditions, ...ruleData } = input
      const rule = await ctx.db.rule.create({
        data: {
          ...ruleData,
          // ruleConditions: ruleConditions?.length
          //   ? {
          //       create: ruleConditions.map(rc => ({
          //         ...rc,
          //         value:
          //           rc.value === null || rc.value === undefined
          //             ? Prisma.DbNull
          //             : rc.value,
          //       })),
          //     }
          //   : undefined,
        },
      })
      return rule
    }),
  update: protectedProcedure
    .input(RuleUpdateInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      const rule = await ctx.db.rule.update({
        where: {
          id,
        },
        data,
      })
      return rule
    }),
  delete: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id } = input
      const rule = await ctx.db.rule.delete({
        where: {
          id,
        },
      })
      return rule
    }),
} satisfies TRPCRouterRecord
