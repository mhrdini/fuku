import { UserSchema } from '@fuku/db/schemas'
import z from 'zod/v4'

export const PasswordSchema = z
  .string()
  .min(8, {
    error: 'invalid_password_length',
  })
  .max(20, {
    error: 'invalid_password_length',
  })

export const RegisterSchema = UserSchema.pick({
  name: true,
  email: true,
  username: true,
}).extend({
  password: PasswordSchema,
})

export const LoginSchema = UserSchema.pick({
  username: true,
}).extend({ password: PasswordSchema, rememberMe: z.boolean().optional() })

export type RegisterSchemaType = z.infer<typeof RegisterSchema>
export type LoginSchemaType = z.infer<typeof LoginSchema>
