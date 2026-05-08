import {
  CountrySchema,
  TeamMemberRoleSchema,
  TeamMemberSchema,
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
} from './operationalHour'
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
  teamMembers: z.array(
    TeamMemberCreateInputSchema.extend({
      id: z.string(),
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
  slug: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  deletedById: true,
})

export type TeamCreateInput = z.infer<typeof TeamCreateInputSchema>

export const UserTeamSchema = TeamSchema.pick({
  id: true,
  slug: true,
  name: true,
  description: true,
  createdAt: true,
}).extend({
  role: TeamMemberRoleSchema,
  teamMembers: z.array(TeamMemberSchema),
})

export type UserTeam = z.infer<typeof UserTeamSchema>

export const TeamUpdateInputSchema = TeamSchema.pick({
  id: true,
  name: true,
  country: true,
  description: true,
  timeZone: true,
}).extend({
  teamMembers: z.array(TeamMemberUpdateInputSchema).optional(),
  payGrades: z.array(PayGradeUpdateInputSchema).optional(),
  locations: z.array(LocationUpdateInputSchema).optional(),
  shiftTypes: z.array(ShiftTypeUpdateInputSchema).optional(),
  operationalHours: z.array(OperationalHourUpdateInputSchema).optional(),
})

export type TeamUpdateInputType = z.infer<typeof TeamUpdateInputSchema>

export const TeamOutputSchema = TeamSchema.extend({
  teamMembers: z.array(TeamMemberSchema),
  country: CountrySchema.nullable(),
})

export type TeamOutput = z.infer<typeof TeamOutputSchema>
