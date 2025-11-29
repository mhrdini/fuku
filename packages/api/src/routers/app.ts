import { createTRPCRouter } from '../trpc'
import { authRouter } from './auth'
import { locationRouter } from './schedule/location'
import { shiftTypeRouter } from './schedule/shiftType'
import { teamRouter } from './team'
import { teamMemberRouter } from './team/member'
import { payGradeRouter } from './team/payGrade'
import { userRouter } from './user'

export const appRouter = createTRPCRouter({
  auth: authRouter,
  user: userRouter,
  team: teamRouter,
  teamMember: teamMemberRouter,
  payGrade: payGradeRouter,
  location: locationRouter,
  shiftType: shiftTypeRouter,
})

export type AppRouter = typeof appRouter
