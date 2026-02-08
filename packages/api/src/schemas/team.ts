import { TeamMember, TeamMemberRole, TeamSchema } from '@fuku/db/schemas'
import z from 'zod/v4'

import {
  LocationCreateInputSchema,
  LocationUpdateInputSchema,
} from './location'
import {
  PayGradeCreateInputSchema,
  PayGradeUpdateInputSchema,
} from './payGrade'
import {
  ShiftTypeCreateInputSchema,
  ShiftTypeUpdateInputSchema,
} from './shiftType'
import {
  TeamMemberCreateInputSchema,
  TeamMemberUpdateInputSchema,
} from './teamMember'

export const TeamCreateInputSchema = TeamSchema.extend({
  name: z.string().min(1, 'invalid_team_name'),
  description: z.string().nullish(),
  teamMembers: z.array(TeamMemberCreateInputSchema),
  payGrades: z.array(
    PayGradeCreateInputSchema.omit({
      teamId: true,
    }).extend({
      id: z.string(),
    }),
  ),
  locations: z.array(
    LocationCreateInputSchema.omit({
      teamId: true,
    }).extend({
      id: z.string(),
    }),
  ),
  shiftTypes: z.array(
    ShiftTypeCreateInputSchema.omit({
      teamId: true,
    }).extend({
      id: z.string(),
    }),
  ),
}).omit({
  id: true,
  slug: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  deletedById: true,
})

export type TeamCreateInput = z.infer<typeof TeamCreateInputSchema>

export type UserTeam = Pick<
  z.infer<typeof TeamSchema>,
  'id' | 'slug' | 'name' | 'description' | 'createdAt'
> & {
  role: TeamMemberRole
  teamMembers: TeamMember[]
}

export const TeamUpdateInputSchema = TeamSchema.pick({
  id: true,
  name: true,
  description: true,
}).extend({
  name: z.string().min(1, 'invalid_team_name').optional(),
  description: z.string().nullish(),
  teamMembers: z.array(TeamMemberUpdateInputSchema).optional(),
  payGrades: z.array(PayGradeUpdateInputSchema).optional(),
  locations: z.array(LocationUpdateInputSchema).optional(),
  shiftTypes: z.array(ShiftTypeUpdateInputSchema).optional(),
})

export type TeamUpdateInputType = z.infer<typeof TeamUpdateInputSchema>
