// --- For data table rows ---
// Extend the schema with included relations

import { TeamMemberOutput, TeamMemberOutputSchema } from '@fuku/api/schemas'
import z from 'zod/v4'

// from the procedure and also with UI-specific fields
export const TeamMemberUISchema = TeamMemberOutputSchema.extend({
  // UI-specific fields
  fullName: z.string(),
  payGradeName: z.string(),
  baseRate: z.number().nullish(),
  effectiveRate: z.number().nullish(),
  username: z.string().nullish(),
})

export type TeamMemberUI = z.infer<typeof TeamMemberUISchema>

export const toTeamMemberUI = (
  m: NonNullable<TeamMemberOutput>,
): TeamMemberUI => ({
  ...m,
  fullName: `${m.givenNames} ${m.familyName}`,
  payGradeName: m.payGrade?.name ?? 'Unassigned',
  baseRate: m.payGrade?.baseRate ?? null,
  effectiveRate: m.payGrade ? m.payGrade.baseRate * m.rateMultiplier : null,
  username: m.user ? m.user.username : null,
})
