import { createTRPCRouter } from '../trpc'
import { authRouter } from './auth'
import { teamRouter } from './team'
import { userRouter } from './user'

export const appRouter = createTRPCRouter({
  auth: authRouter,
  user: userRouter,
  team: teamRouter,
})

export type AppRouter = typeof appRouter
