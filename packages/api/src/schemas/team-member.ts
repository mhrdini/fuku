import {
  ColorHex,
  PayGradeSchema,
  TeamMemberSchema,
  UserSchema,
} from '@fuku/domain/schemas'
import * as z from 'zod/v4'

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
  userId: z.string().optional(),
  username: z.string().optional(),
  payGradeId: z.string().nullish(),
  payGradeClientId: z.string().nullish(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  deletedById: true,
  // userId: true,
})
export type TeamMemberCreateInput = z.infer<typeof TeamMemberCreateInputSchema>

export const TeamMemberUpdateInputSchema = TeamMemberOutputSchema.partial().extend({
  id: z.string(),
  username: z.string().nullish(),
}).omit({
  payGrade: true,
  user: true,
  userId: true,
})

export type TeamMemberUpdateInput = z.infer<typeof TeamMemberUpdateInputSchema>
