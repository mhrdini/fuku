import z from 'zod/v4'

export const TeamMemberRoleSchema = z.enum(['ADMIN', 'STAFF'])

export const TeamMemberRoleValues = Object.fromEntries(
  TeamMemberRoleSchema.options.map(v => [v, v]),
) as { [K in z.infer<typeof TeamMemberRoleSchema>]: K }

export type TeamMemberRole = z.infer<typeof TeamMemberRoleSchema>
