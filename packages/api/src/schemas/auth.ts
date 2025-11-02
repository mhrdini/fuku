import { z } from 'zod/v4'

export const registerSchema = z.object({
  name: z
    .string()
    .min(1, {
      error: 'invalid_name',
    })
    .max(100, { error: 'invalid_name' }),
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
  email: z.email({ error: 'invalid_email' }),
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

export type RegisterSchema = z.infer<typeof registerSchema>
export type LoginSchema = z.infer<typeof loginSchema>
