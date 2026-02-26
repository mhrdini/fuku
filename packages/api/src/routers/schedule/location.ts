import type { TRPCRouterRecord } from '@trpc/server'
import { ColorHex } from '@fuku/domain/schemas'
import z from 'zod/v4'

import { protectedProcedure } from '../../trpc'

export const locationRouter = {
  byId: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.location.findFirst({
        where: {
          id: input.id,
        },
        orderBy: { createdAt: 'asc' },
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
      return ctx.db.location.findMany({
        where: {
          team: {
            id: input.teamId,
          },
          deletedAt: null,
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
    .query(async ({ input, ctx }) => {
      return ctx.db.location.findMany({
        where: {
          team: {
            id: input.teamId,
          },
          deletedAt: null,
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
        address: z.string().nullish(),
        color: ColorHex.optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const created = await ctx.db.location.create({
        data: {
          teamId: input.teamId,
          name: input.name,
          address: input.address,
          color: input.color,
        },
      })
      return created
    }),
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        address: z.string().nullish(),
        color: ColorHex.optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const updated = await ctx.db.location.update({
        where: { id: input.id },
        data: {
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.address !== undefined ? { address: input.address } : {}),
        },
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
      const deleted = await ctx.db.location.update({
        where: { id: input.id },
        data: {
          deletedAt: new Date(),
          deletedById: ctx.session.user.id,
        },
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
      const restored = await ctx.db.location.update({
        where: { id: input.id },
        data: {
          deletedAt: null,
          deletedById: null,
        },
      })
      return restored
    }),
} satisfies TRPCRouterRecord
