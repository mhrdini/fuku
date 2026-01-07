import type { TRPCRouterRecord } from '@trpc/server'
import z from 'zod/v4'

import { teamProcedure } from '../../trpc'
import { numberFromInput } from '../../utils/numberFromInput'

export const payGradeRouter = {
  list: teamProcedure
    .input(
      z.object({
        limit: z.number().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.payGrade.findMany({
        where: {
          teamId: ctx.activeTeamId,
        },
        ...(input.limit && { take: input.limit }),
        orderBy: { createdAt: 'asc' },
      })
    }),

  create: teamProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().nullish(),
        baseRate: numberFromInput({ min: 0 }),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.db.payGrade.create({
        data: {
          teamId: ctx.activeTeamId,
          name: input.name,
          ...(input.description !== undefined
            ? { description: input.description }
            : {}),
          baseRate: input.baseRate,
        },
      })
    }),

  update: teamProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        description: z.string().nullish(),
        baseRate: numberFromInput({ min: 0 }).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.db.payGrade.update({
        where: {
          id: input.id,
          teamId: ctx.activeTeamId,
        },
        data: {
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.description !== undefined
            ? { description: input.description }
            : {}),
          ...(input.baseRate !== undefined ? { baseRate: input.baseRate } : {}),
        },
      })
    }),

  delete: teamProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.db.payGrade.delete({
        where: {
          id: input.id,
          teamId: ctx.activeTeamId,
        },
      })
    }),
} satisfies TRPCRouterRecord
