import z from 'zod/v4'

export const UserSchema = z.object({
  id: z.string(),
  name: z.string().min(1, {
    error: 'invalid_name',
  }),
  email: z.email({ error: 'invalid_email' }),
  emailVerified: z.boolean(),
  image: z.string().nullable(),
  username: z
    .string()
    .min(3, {
      error: 'invalid_username_length',
    })
    .max(30, {
      error: 'invalid_username_length',
    })
    .regex(/^[a-zA-Z0-9_-]+$/, {
      error: 'invalid_username_characters',
    }),
  displayUsername: z.string(),

  lastActiveTeamId: z.string().nullable(),

  createdAt: z.date(),
  updatedAt: z.date(),
})

export type User = z.infer<typeof UserSchema>
