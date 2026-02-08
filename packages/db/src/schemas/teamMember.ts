import z from 'zod/v4'

import { TeamMemberRoleSchema } from './enums'
import { ColorHex } from './helpers'

export const TeamMemberSchema = z.object({
  id: z.string(),
  userId: z.string().nullable(),

  familyName: z.string(),
  givenNames: z.string().min(1, 'invalid_given_names'),

  teamId: z.string(),
  payGradeId: z.string().nullable(),

  teamMemberRole: TeamMemberRoleSchema,
  rateMultiplier: z.number().min(0, 'invalid_rate_multiplier'),

  color: ColorHex.optional(),

  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
  deletedById: z.string().nullable(),
})

export type TeamMember = z.infer<typeof TeamMemberSchema>
