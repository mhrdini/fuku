import type { TRPCRouterRecord } from '@trpc/server'
import z from 'zod/v4'

import { teamProcedure } from '../../trpc'

export const shiftTypeRouter = {
  list: teamProcedure
    .input(
      z.object({
        limit: z.number().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const shiftTypes = await ctx.db.shiftType.findMany({
        where: {
          team: {
            id: ctx.activeTeamId,
          },
          deletedAt: null,
        },
        ...(input.limit && { take: input.limit }),
        orderBy: {
          createdAt: 'asc',
        },
      })
      return shiftTypes
    }),
  create: teamProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        startTime: z.string(),
        endTime: z.string(),
        color: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const created = await ctx.db.shiftType.create({
        data: {
          teamId: ctx.activeTeamId,
          name: input.name,
          ...(input.description && { description: input.description }),
          startTime: input.startTime,
          endTime: input.endTime,
          ...(input.color && { color: input.color }),
        },
      })
      return created
    }),
  update: teamProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().nullish(),
        description: z.string().nullish(),
        startTime: z.string().nullish(),
        endTime: z.string().nullish(),
        color: z.string().nullish(),
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
        },
      })
      return updated
    }),
  delete: teamProcedure
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
      })
      return deleted
    }),
  restore: teamProcedure
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
      })
      return restored
    }),
} satisfies TRPCRouterRecord
