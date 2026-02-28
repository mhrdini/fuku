import z from 'zod/v4'

import { DayOfWeekSchema } from './helpers'

export const StaffingRequirementSchema = z.object({
  teamId: z.string(),
  dayOfWeek: DayOfWeekSchema,
  minMembers: z.number().int().nonnegative(),
  maxMembers: z.number().int().nonnegative(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type StaffingRequirement = z.infer<typeof StaffingRequirementSchema>
