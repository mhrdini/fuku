import type { TRPCRouterRecord } from '@trpc/server'
import z from 'zod/v4'

import { teamProcedure } from '../../trpc'

export const locationRouter = {
  list: teamProcedure
    .input(
      z.object({
        limit: z.number().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const locations = await ctx.db.location.findMany({
        where: {
          team: {
            id: ctx.activeTeamId,
          },
          deletedAt: null,
        },
        ...(input.limit && { take: input.limit }),
        orderBy: { createdAt: 'asc' },
      })
      return locations
    }),
  create: teamProcedure
    .input(
      z.object({
        name: z.string(),
        address: z.string().nullish(),
        color: z.string().nullish(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const created = await ctx.db.location.create({
        data: {
          teamId: ctx.activeTeamId,
          name: input.name,
          address: input.address,
          color: input.color,
        },
      })
      return created
    }),
  update: teamProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        address: z.string().nullish(),
        color: z.string().nullish(),
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
  delete: teamProcedure
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
  restore: teamProcedure
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
