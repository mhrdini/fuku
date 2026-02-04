import z from 'zod/v4'

import { TeamMemberRoleSchema } from './enums'
import { ColorHex } from './helpers'

export const TeamMemberSchema = z.object({
  id: z.string(),
  userId: z.string().nullable(),

  familyName: z.string(),
  givenNames: z.string(),

  teamId: z.string(),
  payGradeId: z.string().nullable(),

  teamMemberRole: TeamMemberRoleSchema,
  rateMultiplier: z.number(),

  color: ColorHex.optional(),

  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
  deletedById: z.string().nullable(),
})

export type TeamMember = z.infer<typeof TeamMemberSchema>
