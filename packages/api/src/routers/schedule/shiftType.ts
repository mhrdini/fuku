import type { TRPCRouterRecord } from '@trpc/server'
import { ColorHex } from '@fuku/db/schemas'
import z from 'zod/v4'

import { ShiftTypeCreateInputSchema } from '../../schemas'
import { protectedProcedure } from '../../trpc'

export const shiftTypeRouter = {
  byId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.shiftType.findFirst({
        where: {
          id: input.id,
          deletedAt: null,
        },
        include: {
          eligiblePayGrades: true,
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
    .query(async ({ input, ctx }) => {
      return ctx.db.shiftType.findMany({
        where: {
          team: {
            id: input.teamId,
          },
          deletedAt: null,
        },
        ...(input.limit && { take: input.limit }),
        orderBy: {
          createdAt: 'asc',
        },
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
    .query(async ({ input, ctx }) => {
      const detailed = await ctx.db.shiftType.findMany({
        where: {
          team: {
            id: input.teamId,
          },
          deletedAt: null,
        },
        ...(input.limit && { take: input.limit }),
        include: {
          eligiblePayGrades: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      })
      return detailed
    }),
  create: protectedProcedure
    .input(ShiftTypeCreateInputSchema)
    .mutation(async ({ input, ctx }) => {
      const created = await ctx.db.shiftType.create({
        data: {
          teamId: input.teamId,
          name: input.name,
          ...(input.description && { description: input.description }),
          startTime: input.startTime,
          endTime: input.endTime,
          ...(input.color && { color: input.color }),
          ...(input.connectPayGrades?.length
            ? {
                eligiblePayGrades: {
                  create: input.connectPayGrades.map(id => ({
                    payGrade: {
                      connect: { id },
                    },
                  })),
                },
              }
            : {}),
        },
        include: { eligiblePayGrades: true },
      })
      return created
    }),
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().nullish(),
        description: z.string().nullish(),
        startTime: z.string().nullish(),
        endTime: z.string().nullish(),
        color: ColorHex.optional(),
        connectPayGrades: z.array(z.string()).optional(),
        disconnectPayGrades: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const updated = await ctx.db.shiftType.update({
        where: {
          id: input.id,
        },
        data: {
          ...(input.name && { name: input.name }),
          ...(input.description && { description: input.description }),
          ...(input.startTime && { startTime: input.startTime }),
          ...(input.endTime && { endTime: input.endTime }),
          ...(input.color && { color: input.color }),
          ...(input.connectPayGrades?.length
            ? {
                eligiblePayGrades: {
                  create: input.connectPayGrades.map(id => ({
                    payGrade: { connect: { id } },
                  })),
                },
              }
            : {}),
          ...(input.disconnectPayGrades?.length
            ? {
                eligiblePayGrades: {
                  deleteMany: input.disconnectPayGrades.map(payGradeId => ({
                    payGradeId,
                  })),
                },
              }
            : {}),
        },
        include: { eligiblePayGrades: true },
      })
      return updated
    }),
  delete: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const deleted = await ctx.db.shiftType.update({
        where: {
          id: input.id,
        },
        data: {
          deletedAt: new Date(),
          deletedById: ctx.session.user.id,
        },
        include: { eligiblePayGrades: true },
      })
      return deleted
    }),
  restore: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const restored = await ctx.db.shiftType.update({
        where: {
          id: input.id,
        },
        data: {
          deletedAt: null,
          deletedById: null,
        },
        include: { eligiblePayGrades: true },
      })
      return restored
    }),
} satisfies TRPCRouterRecord
