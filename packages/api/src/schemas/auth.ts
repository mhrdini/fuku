import { z } from 'zod/v4'

export const usernameSchema = z
  .string()
  .min(3, {
    error: 'invalid_username_length',
  })
  .max(30, {
    error: 'invalid_username_length',
  })
  .regex(/^[a-zA-Z0-9_-]+$/, {
    error: 'invalid_username_characters',
  })

export const registerSchema = z.object({
  name: z
    .string()
    .min(1, {
      error: 'invalid_name',
    })
    .max(100, { error: 'invalid_name' }),
  username: usernameSchema,
  email: z.email({ error: 'invalid_email' }),
  password: z
    .string()
    .min(8, {
      error: 'invalid_password_length',
    })
    .max(20, {
      error: 'invalid_password_length',
    }),
})

export const loginSchema = z.object({
  username: usernameSchema,
  password: z
    .string()
    .min(8, {
      error: 'invalid_password_length',
    })
    .max(20, {
      error: 'invalid_password_length',
    }),
  rememberMe: z.boolean().optional(),
})

export type RegisterSchemaType = z.infer<typeof registerSchema>
export type LoginSchemaType = z.infer<typeof loginSchema>
