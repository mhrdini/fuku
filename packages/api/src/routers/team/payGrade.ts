import type { TRPCRouterRecord } from '@trpc/server'
import z from 'zod/v4'

import { protectedProcedure } from '../../trpc'
import { numberFromInput } from '../../utils/numberFromInput'

export const payGradeRouter = {
  list: protectedProcedure
    .input(
      z.object({
        teamId: z.string(),
        limit: z.number().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.payGrade.findMany({
        where: {
          teamId: input.teamId,
        },
        ...(input.limit && { take: input.limit }),
        orderBy: { createdAt: 'asc' },
      })
    }),

  create: protectedProcedure
    .input(
      z.object({
        teamId: z.string(),
        name: z.string(),
        description: z.string().nullish(),
        baseRate: numberFromInput({ min: 0 }),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const pg = ctx.db.payGrade.create({
        data: {
          teamId: input.teamId,
          name: input.name,
          ...(input.description !== undefined
            ? { description: input.description }
            : {}),
          baseRate: input.baseRate,
        },
      })
      return pg
    }),

  update: protectedProcedure
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

  delete: protectedProcedure
    .input(
      z.object({
        teamId: z.string(),
        id: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.db.payGrade.delete({
        where: {
          id: input.id,
          teamId: input.teamId,
        },
      })
    }),
} satisfies TRPCRouterRecord
