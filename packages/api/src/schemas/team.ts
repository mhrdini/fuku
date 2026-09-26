import {
  CountrySchema,
  TeamMemberRoleSchema,
  TeamSchema,
} from '@fuku/domain/schemas'
import * as z from 'zod/v4'

import {
  LocationCreateInputSchema,
  LocationUpdateInputSchema,
} from './location'
import {
  OperationalHourCreateInputSchema,
  OperationalHourUpdateInputSchema,
} from './operational-hour'
import {
  PayGradeCreateInputSchema,
  PayGradeUpdateInputSchema,
} from './pay-grade'
import {
  ShiftTypeCreateInputSchema,
  ShiftTypeUpdateInputSchema,
} from './shift-type'
import {
  TeamMemberCreateInputSchema,
  TeamMemberUpdateInputSchema,
} from './team-member'

export const TeamCreateInputSchema = TeamSchema.extend({
  teamMembers: z.array(
    TeamMemberCreateInputSchema.extend({
      id: z.string(),
      teamId: z.string().optional(),
    }),
  ),
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
  operationalHours: z
    .array(
      OperationalHourCreateInputSchema.omit({
        teamId: true,
      }).extend({
        id: z.string(),
      }),
    )
    .optional(),
}).omit({
  id: true,
  publicId: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  deletedById: true,
})

export type TeamCreateInput = z.infer<typeof TeamCreateInputSchema>

export const TeamUpdateInputSchema = TeamSchema.partial().extend({
  teamMembers: z.array(TeamMemberUpdateInputSchema).optional(),
  payGrades: z.array(PayGradeUpdateInputSchema).optional(),
  locations: z.array(LocationUpdateInputSchema).optional(),
  shiftTypes: z.array(ShiftTypeUpdateInputSchema).optional(),
  operationalHours: z.array(OperationalHourUpdateInputSchema).optional(),
})

export type TeamUpdateInputType = z.infer<typeof TeamUpdateInputSchema>

export const TeamOutputSchema = TeamSchema.extend({
  // teamMembers: z.array(TeamMemberSchema),
  country: CountrySchema.nullable(),
})

export type TeamOutput = z.infer<typeof TeamOutputSchema>

export const UserTeamSchema = TeamOutputSchema.extend({
  teamMemberRole: TeamMemberRoleSchema,
  teamMembersCount: z.number(),
})

export type UserTeam = z.infer<typeof UserTeamSchema>
