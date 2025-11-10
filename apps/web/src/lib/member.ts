// --- For data table rows ---
// Extend the  schema with included relations

import {
  DayAssignmentSchema,
  PayGradeSchema,
  TeamMemberSchema as TeamMemberZodSchema,
  TeamSchema,
  UnavailabilitySchema,
  UserSchema,
} from '@fuku/db/schemas'
import z from 'zod/v4'

// from the procedure and also with UI-specific fields
export const TeamMemberSchema = TeamMemberZodSchema.extend({
  dayAssignments: DayAssignmentSchema.partial().array().nullish(),
  unavailabilities: UnavailabilitySchema.partial().array().nullish(),
  team: TeamSchema.partial().nullish(),
  user: UserSchema.partial().nullish(),
  payGrade: PayGradeSchema.partial().nullish(),
  teamMemberRole: TeamMemberZodSchema.shape.teamMemberRole.unwrap(),
  rateMultiplier: TeamMemberZodSchema.shape.rateMultiplier.unwrap(),
})

export type TeamMemberType = z.infer<typeof TeamMemberSchema>

export const TeamMemberUISchema = TeamMemberSchema.extend({
  // UI-specific fields
  fullName: z.string(),
  payGradeName: z.string(),
  baseRate: z.number().nullish(),
  effectiveRate: z.number().nullish(),
  username: z.string().nullish(),
})

export type TeamMemberUI = z.infer<typeof TeamMemberUISchema>

export const toTeamMemberUI = (
  m: z.infer<typeof TeamMemberSchema>,
): TeamMemberUI => ({
  ...m,
  fullName: `${m.givenNames} ${m.familyName}`,
  payGradeName: m.payGrade?.name ?? 'No Pay Grade',
  baseRate: m.payGrade?.baseRate ?? null,
  effectiveRate: m.payGrade ? m.payGrade.baseRate! * m.rateMultiplier : null,
  username: m.user ? m.user.username : null,
})
