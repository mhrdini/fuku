import {
  DayOfWeekKey,
  DayOfWeekKeySchema,
  StaffingRequirementSchema,
} from '@fuku/domain/schemas'
import z from 'zod/v4'


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
    dayOfWeek: StaffingRequirementCreateInputSchema.shape.dayOfWeek,
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
      DayOfWeekKeySchema.options.map(day => [
        day,
        StaffingRequirementOutputValueSchema,
      ]),
    ) as Record<DayOfWeekKey, typeof StaffingRequirementOutputValueSchema>,
  )
  .partial()

export type StaffingRequirementsOutput = z.infer<
  typeof StaffingRequirementsOutputSchema
>
