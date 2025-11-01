import type { TRPCRouterRecord } from '@trpc/server'

import { loginSchema, registerSchema } from '../schemas/auth'
import { protectedProcedure, publicProcedure } from '../trpc'

export const authRouter = {
  getSession: publicProcedure.query(({ ctx }) => ctx.session),
  getSecretMessage: protectedProcedure.query(
    () => 'You are logged in and can see this secret message!',
  ),
  register: publicProcedure
    .input(registerSchema)
    .mutation(async ({ input, ctx }) => {
      // Automatically signs the user in if autoSignIn is true
      const user = await ctx.authApi.signUpEmail({
        body: input,
      })
      return user
    }),
  login: publicProcedure.input(loginSchema).mutation(async ({ input, ctx }) => {
    const session = await ctx.authApi.signInEmail({
      body: input,
    })
    return session
  }),
  logout: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.authApi.signOut()
    return { success: true }
  }),
} satisfies TRPCRouterRecord
