import type { TRPCRouterRecord } from '@trpc/server'
import z from 'zod/v4'

import { protectedProcedure } from '../../trpc'

export const locationRouter = {
  getAllByTeam: protectedProcedure
    .input(
      z
        .object({
          teamId: z.string().optional(),
          teamSlug: z.string().optional(),
          limit: z.number().optional(),
        })
        .refine(data => data.teamId || data.teamSlug, {
          message: 'Either teamId or teamSlug must be provided',
        }),
    )
    .query(async ({ input, ctx }) => {
      const locations = await ctx.db.location.findMany({
        where: {
          team: {
            ...(input.teamId ? { id: input.teamId } : {}),
            ...(input.teamSlug ? { slug: input.teamSlug } : {}),
          },
        },
        ...(input.limit && { take: input.limit }),
      })
      return locations
    }),
  create: protectedProcedure
    .input(
      z.object({
        teamId: z.string(),
        name: z.string(),
        address: z.string().nullable().optional(),
        color: z.string().nullable().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const newLocation = await ctx.db.location.create({
        data: {
          teamId: input.teamId,
          name: input.name,
          address: input.address,
          color: input.color,
        },
      })
      return newLocation
    }),
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        address: z.string().nullable().optional(),
        color: z.string().nullable().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const updatedLocation = await ctx.db.location.update({
        where: { id: input.id },
        data: {
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.address !== undefined ? { address: input.address } : {}),
        },
      })
      return updatedLocation
    }),
  delete: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await ctx.db.location.update({
        where: { id: input.id },
        data: {
          deletedAt: new Date(),
          deletedById: ctx.session.user.id,
        },
      })
      return { success: true }
    }),
  restore: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await ctx.db.location.update({
        where: { id: input.id },
        data: {
          deletedAt: null,
          deletedById: null,
        },
      })
      return { success: true }
    }),
} satisfies TRPCRouterRecord
