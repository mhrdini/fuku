import type { TRPCRouterRecord } from '@trpc/server'
import { z } from 'zod/v4'

import { protectedProcedure, publicProcedure } from '../trpc'

export const authRouter = {
  getSession: publicProcedure.query(({ ctx }) => ctx.session),
  getSecretMessage: protectedProcedure.query(
    () => 'You are logged in and can see this secret message!',
  ),
  signUp: publicProcedure
    .input(
      z.object({
        email: z.email(),
        password: z.string().min(8),
        name: z.string().min(1),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Automatically signs the user in if autoSignIn is true
      const user = await ctx.authApi.signUpEmail({
        body: input,
      })
      return user
    }),
  signIn: publicProcedure
    .input(
      z.object({
        email: z.string().min(1),
        password: z.string().min(1),
        rememberMe: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const session = await ctx.authApi.signInEmail({
        body: input,
      })
      return session
    }),
  signOut: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.authApi.signOut()
    return { success: true }
  }),
} satisfies TRPCRouterRecord
