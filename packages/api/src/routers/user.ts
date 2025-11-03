import { TRPCError, TRPCRouterRecord } from '@trpc/server'
import { z } from 'zod/v4'

import { protectedProcedure } from '../trpc'

export const userRouter = {
  byId: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { id } = input
      const user = await ctx.db.user.findUnique({
        where: { id },
      })
      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `No user with id '${id}'`,
        })
      }
      return user
    }),
  byUsername: protectedProcedure
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
      }
      return user
    }),
} satisfies TRPCRouterRecord
