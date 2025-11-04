import { TRPCError, TRPCRouterRecord } from '@trpc/server'
import z from 'zod/v4'

import { protectedProcedure } from '../trpc'

export const userRouter = {
  getById: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: input.id },
      })
      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `No user with id '${input.id}'`,
        })
      }
      return user
    }),
  getByUsername: protectedProcedure
    .input(
      z.object({
        username: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { username } = input
      const user = await ctx.db.user.findUnique({
        where: { username },
      })
      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `No user with username '${username}'`,
        })

      return user
    }),

  getByUsername: protectedProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ input, ctx }) => {
      if (!input.username)
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Username is required',
        })

      const user = await ctx.db.user.findUnique({
        where: { username: input.username },
      })
      if (!user)
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `No user with username '${input.username}'`,
        })

      return user
    }),

  getMyMemberships: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id
    const memberships = await ctx.db.teamMember.findMany({
      where: {
        userId,
        deletedAt: null,
        team: { deletedAt: null },
      },
      include: { team: true, payGrade: true },
    })

    return memberships.map(member => ({
      ...member,
      effectiveRate: member.payGrade
        ? member.payGrade.baseRate * member.rateMultiplier
        : null,
    }))
  }),
} satisfies TRPCRouterRecord
