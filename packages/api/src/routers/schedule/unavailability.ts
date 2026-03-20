import { TRPCRouterRecord } from '@trpc/server'
import * as z from 'zod/v4'

import { UnavailabilityCreateInputSchema } from '../../schemas'
import { protectedProcedure } from '../../trpc'

export const unavailabilityRouter = {
  list: protectedProcedure
    .input(
      z.object({
        teamId: z.string(),
        start: z.date(),
        end: z.date(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { teamId, start, end } = input

      const unavailabilities = await ctx.db.unavailability.findMany({
        where: {
          teamMember: {
            teamId,
            deletedAt: null,
          },
          date: {
            gte: start,
            lte: end,
          },
        },
      })

      return unavailabilities.map(unavailability => ({
        ...unavailability,
        reason: unavailability.reason ?? undefined,
      }))
    }),
  create: protectedProcedure
    .input(UnavailabilityCreateInputSchema)
    .mutation(async ({ ctx, input }) => {
      const unavailability = await ctx.db.unavailability.create({
        data: input,
      })

      return unavailability
    }),

  createMany: protectedProcedure
    .input(z.array(UnavailabilityCreateInputSchema))
    .mutation(async ({ ctx, input }) => {
      const unavailabilities = await ctx.db.unavailability.createMany({
        data: input,
        skipDuplicates: true,
      })

      return unavailabilities
    }),

  deleteById: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id } = input

      return await ctx.db.unavailability.delete({
        where: {
          id,
        },
      })
    }),
  delete: protectedProcedure
    .input(
      z.object({
        teamMemberId: z.string(),
        date: z.date(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { teamMemberId, date } = input

      return await ctx.db.unavailability.deleteMany({
        where: {
          teamMemberId,
          date,
        },
      })
    }),
} satisfies TRPCRouterRecord
