import {
  LocationSchema,
  PayGradeSchema,
  ShiftTypeSchema,
  TeamMemberSchema,
} from '@fuku/db/schemas'
import { z } from 'zod/v4'

export const TeamCreateInputSchema = z.object({
  name: z.string().min(1, 'invalid_team_name'),
  description: z.string().optional(),

  teamMembers: z.array(
    TeamMemberSchema.partial().extend({
      id: z.string(),
      userId: z.string().nullish(),
      familyName: z.string(),
      givenNames: z.string().min(1, 'invalid_given_names'),
      teamMemberRole: z.enum(['ADMIN', 'STAFF']),
      rateMultiplier: z.number().min(0, 'invalid_rate_multiplier'),
      payGradeClientId: z.string().nullish(),
    }),
  ),

  payGrades: z.array(
    PayGradeSchema.partial().extend({
      id: z.string(),
      name: z.string().min(1, 'invalid_pay_grade_name'),
      baseRate: z.number().min(0, 'invalid_base_rate'),
    }),
  ),

  locations: z.array(
    LocationSchema.partial().extend({
      id: z.string(),
      name: z.string().min(1, 'invalid_location_name'),
      color: z.string().nullish(),
    }),
  ),

  shiftTypes: z.array(
    ShiftTypeSchema.partial().extend({
      id: z.string(),
      name: z.string().min(1, 'invalid_shift_type_name'),
      startTime: z.string(),
      endTime: z.string(),
    }),
  ),
})

export type TeamCreateInputType = z.infer<typeof TeamCreateInputSchema>

export type TeamMember = {
  id: string
  userId: string | null
  familyName: string
  givenNames: string
  teamMemberRole: 'ADMIN' | 'STAFF'
  rateMultiplier: number
}

export type UserTeam = {
  id: string
  slug: string
  name: string
  description: string | null
  createdAt: Date
  role: 'ADMIN' | 'STAFF'
  teamMembers: Array<TeamMember>
}
