import {
  ColorHex,
  PayGradeSchema,
  TeamMemberSchema,
  UserSchema,
} from '@fuku/db/schemas'
import z from 'zod/v4'

// output must never have optional fields - they should be nullable if they can be missing
export const TeamMemberOutputSchema = TeamMemberSchema.extend({
  color: ColorHex,
  user: UserSchema.nullable(),
  payGrade: PayGradeSchema.extend({
    description: z.string().nullable(),
  }).nullable(),
})

export type TeamMemberOutput = z.infer<typeof TeamMemberOutputSchema>

export const TeamMemberCreateInputSchema = TeamMemberSchema.extend({
  username: z.string().optional(),
  userId: z.string().optional(),
  givenNames: z.string().min(1, 'invalid_given_names'),
  rateMultiplier: z.number().min(0, 'invalid_rate_multiplier'),
  payGradeId: z.string().nullish(),
  payGradeClientId: z.string().nullish(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  deletedById: true,
})
export type TeamMemberCreateInput = z.infer<typeof TeamMemberCreateInputSchema>

export const TeamMemberUpdateInputSchema = TeamMemberOutputSchema.extend({
  username: z.string().optional(),
  givenNames: z.string().min(1, 'invalid_given_names').optional(),
  rateMultiplier: z.number().min(0, 'invalid_rate_multiplier').optional(),
})
export type TeamMemberUpdateInput = z.infer<typeof TeamMemberUpdateInputSchema>
