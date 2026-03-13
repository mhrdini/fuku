import {
  StaffingRequirementSchema,
  WeekdayKey,
  WeekdayKeySchema,
} from '@fuku/domain/schemas'
import * as z from 'zod/v4'

export const StaffingRequirementCreateInputSchema =
  StaffingRequirementSchema.omit({
    createdAt: true,
    updatedAt: true,
  })

export type StaffingRequirementCreateInput = z.infer<
  typeof StaffingRequirementCreateInputSchema
>

export const StaffingRequirementUpdateInputSchema =
  StaffingRequirementCreateInputSchema.partial().extend({
    teamId: StaffingRequirementCreateInputSchema.shape.teamId,
    weekday: StaffingRequirementCreateInputSchema.shape.weekday,
  })

export type StaffingRequirementUpdateInput = z.infer<
  typeof StaffingRequirementUpdateInputSchema
>

const StaffingRequirementOutputValueSchema = StaffingRequirementSchema.pick({
  teamId: true,
  minMembers: true,
  maxMembers: true,
})

export const StaffingRequirementsOutputSchema = z
  .object(
    Object.fromEntries(
      WeekdayKeySchema.options.map(day => [
        day,
        StaffingRequirementOutputValueSchema,
      ]),
    ) as Record<WeekdayKey, typeof StaffingRequirementOutputValueSchema>,
  )
  .partial()

export type StaffingRequirementsOutput = z.infer<
  typeof StaffingRequirementsOutputSchema
>
