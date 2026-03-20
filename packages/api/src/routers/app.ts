import { createTRPCRouter } from '../trpc'
import { authRouter } from './auth'
import { scheduleRouter } from './schedule'
import { dayAssignmentRouter } from './schedule/dayAssignment'
import { locationRouter } from './schedule/location'
import { operationalHourRouter } from './schedule/operationalHour'
import { ruleRouter } from './schedule/rule'
import { ruleConditionRouter } from './schedule/ruleCondition'
import { shiftTypeRouter } from './schedule/shiftType'
import { staffingRequirementRouter } from './schedule/staffingRequirement'
import { unavailabilityRouter } from './schedule/unavailability'
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
  operationalHour: operationalHourRouter,
  schedule: scheduleRouter,
  dayAssignment: dayAssignmentRouter,
  staffingRequirement: staffingRequirementRouter,
  rule: ruleRouter,
  ruleCondition: ruleConditionRouter,
  unavailability: unavailabilityRouter,
})

export type AppRouter = typeof appRouter
