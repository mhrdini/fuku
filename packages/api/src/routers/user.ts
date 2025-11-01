import { TRPCError, TRPCRouterRecord } from '@trpc/server'
import { z } from 'zod/v4'

import { publicProcedure } from '../trpc'

export const userRouter = {
  byId: publicProcedure
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
          message: `No post with id '${id}'`,
        })
      }
      return user
    }),
} satisfies TRPCRouterRecord
