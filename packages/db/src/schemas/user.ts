import z from 'zod/v4'

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  emailVerified: z.boolean(),
  image: z.string().nullable(),
  username: z.string(),
  displayUsername: z.string(),

  lastActiveTeamId: z.string().nullable(),

  createdAt: z.date(),
  updatedAt: z.date(),
})

export type User = z.infer<typeof UserSchema>
