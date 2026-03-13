import { TRPCRouterRecord } from '@trpc/server'
import * as z from 'zod/v4'

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
} satisfies TRPCRouterRecord
