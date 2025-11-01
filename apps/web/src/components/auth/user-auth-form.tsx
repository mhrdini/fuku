'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  loginSchema,
  LoginSchema,
  registerSchema,
  RegisterSchema,
} from '@fuku/api/schemas'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { authClient } from '~/auth/client'

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> {
  register?: boolean
}

type UserAuthSchema = LoginSchema | RegisterSchema

export function UserAuthForm({
  className,
  register,
  ...props
}: UserAuthFormProps) {
  const [isRegister] = useState<boolean>(register || false)
  const router = useRouter()
  const form = useForm<UserAuthSchema>({
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
    resolver: zodResolver(isRegister ? registerSchema : loginSchema),
  })

  const onSubmit = async (data: UserAuthSchema) => {
    if (isRegister) {
      await authClient.signUp.email(data as RegisterSchema, {
        onError: ctx => {
          form.setError('root', { message: ctx.error.message })
        },
        onSuccess: () => {
          router.push('/')
        },
      })
    } else {
      await authClient.signIn.email(data as LoginSchema, {
        onError: ctx => {
          form.setError('root', { message: ctx.error.message })
        },
        onSuccess: () => {
          router.push('/')
        },
      })
    }
  }

  return (
    <div className={className} {...props}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {isRegister && (
          <>
            <label>Name</label>
            <input {...form.register('name')} />
          </>
        )}
        <label>Email</label>
        <input type='email' {...form.register('email')} />
        <label>Password</label>
        <input type='password' {...form.register('password')} />
        <button type='submit'>{isRegister ? 'Register' : 'Login'}</button>
      </form>
    </div>
  )
}
