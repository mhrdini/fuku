import type { TRPCRouterRecord } from '@trpc/server'
import z from 'zod/v4'

import { protectedProcedure } from '../../trpc'
import { numberFromInput } from '../../utils/numberFromInput'

export const payGradeRouter = {
  byId: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.payGrade.findFirst({
        where: {
          id: input.id,
        },
        include: {
          eligibleShiftTypes: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      })
    }),

  listIds: protectedProcedure
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
        select: {
          id: true,
        },
      })
    }),

  listDetailed: protectedProcedure
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
        include: {
          eligibleShiftTypes: true,
        },
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
        connectShiftTypes: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const pg = await ctx.db.payGrade.create({
        data: {
          teamId: input.teamId,
          name: input.name,
          baseRate: input.baseRate,
          ...(input.description !== undefined
            ? { description: input.description }
            : {}),
          ...(input.connectShiftTypes?.length
            ? {
                eligibleShiftTypes: {
                  create: input.connectShiftTypes.map(id => ({
                    shiftType: {
                      connect: { id },
                    },
                  })),
                },
              }
            : {}),
        },
        include: {
          eligibleShiftTypes: true,
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
        connectShiftTypes: z.array(z.string()).optional(),
        disconnectShiftTypes: z.array(z.string()).optional(),
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
          ...(input.connectShiftTypes?.length
            ? {
                eligibleShiftTypes: {
                  create: input.connectShiftTypes.map(id => ({
                    shiftType: {
                      connect: { id },
                    },
                  })),
                },
              }
            : {}),
          ...(input.disconnectShiftTypes?.length
            ? {
                eligibleShiftTypes: {
                  deleteMany: input.disconnectShiftTypes.map(shiftTypeId => ({
                    shiftTypeId,
                  })),
                },
              }
            : {}),
        },
        include: {
          eligibleShiftTypes: true,
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
        include: {
          eligibleShiftTypes: true,
        },
      })
    }),
} satisfies TRPCRouterRecord
