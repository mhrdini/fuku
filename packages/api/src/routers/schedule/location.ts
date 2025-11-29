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
} satisfies TRPCRouterRecord
