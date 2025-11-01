import { authRouter } from '../routers/auth'
import { createTRPCRouter } from '../trpc'
import { userRouter } from './user'

export const appRouter = createTRPCRouter({
  auth: authRouter,
  user: userRouter,
})

export type AppRouter = typeof appRouter
