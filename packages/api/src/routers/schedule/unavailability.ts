import * as z from 'zod/v4'

import type { TRPCRouterRecord } from '@trpc/server'

import {
  UnavailabilityCreateInputSchema,
  UnavailabilityOutputSchema,
} from '../../schemas'
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
    .output(z.array(UnavailabilityOutputSchema))
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
        reason: unavailability.reason ?? null,
      }))
    }),

  create: protectedProcedure
    .input(UnavailabilityCreateInputSchema)
    .output(UnavailabilityOutputSchema)
    .mutation(async ({ ctx, input }) => {
      const { reason, ...data } = input

      const unavailability = await ctx.db.unavailability.create({
        data: { ...data, ...(reason && { reason }) },
      })

      return unavailability
    }),

  createMany: protectedProcedure
    .input(z.array(UnavailabilityCreateInputSchema))
    .output(z.object({
      count: z.number(),
    }))
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
    .output(UnavailabilityOutputSchema)
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
    .output(z.object({
      count: z.number(),
    }))
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
