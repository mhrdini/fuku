'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  LoginSchema,
  LoginSchemaType,
  RegisterSchema,
  RegisterSchemaType,
} from '@fuku/api/schemas'
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
  Input,
  LoadingButton,
} from '@fuku/ui/components'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'

import { authClient } from '~/auth/client'

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> {
  register?: boolean
}

type UserAuthSchemaType = LoginSchemaType | RegisterSchemaType

export function UserAuthForm({
  className,
  register,
  ...props
}: UserAuthFormProps) {
  const [isRegister] = useState<boolean>(register || false)
  const router = useRouter()
  const form = useForm<UserAuthSchemaType>({
    defaultValues: {
      name: '',
      username: '',
      email: '',
      password: '',
    },
    resolver: zodResolver(isRegister ? RegisterSchema : LoginSchema),
  })

  const onLoginClick = () => {
    router.push('/login')
  }

  const onRegisterClick = () => {
    router.push('/register')
  }

  const onSubmit = async (data: UserAuthSchemaType) => {
    if (isRegister) {
      await authClient.signUp.email(data as RegisterSchemaType, {
        onError: ctx => {
          form.setError('root', { message: ctx.error.message })
        },
        onSuccess: () => {
          router.push(`/${data.username}`)
        },
      })
    } else {
      await authClient.signIn.username(data as LoginSchemaType, {
        onError: ctx => {
          form.setError('root', { message: ctx.error.message })
        },
        onSuccess: () => {
          router.push(`/${data.username}`)
        },
      })
    }
  }

  return (
    <div className={className} {...props}>
      <Card className='border-none w-full sm:max-w-md'>
        <CardHeader>
          <CardTitle>{isRegister ? 'Create Account' : 'Login'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form id='form-user-auth' onSubmit={form.handleSubmit(onSubmit)}>
            <FieldSet>
              <FieldGroup>
                {isRegister && (
                  <Controller
                    name='name'
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor='form-user-auth-name'>
                          Name
                        </FieldLabel>
                        <Input
                          {...field}
                          id='form-user-auth-name'
                          aria-invalid={fieldState.invalid}
                          placeholder='Name'
                          autoComplete='off'
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                )}
                <Controller
                  name='username'
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor='form-user-auth-username'>
                        Username
                      </FieldLabel>
                      <Input
                        {...field}
                        id='form-user-auth-username'
                        aria-invalid={fieldState.invalid}
                        placeholder='Username'
                        autoComplete='off'
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                {isRegister && (
                  <Controller
                    name='email'
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor='form-user-auth-email'>
                          Email
                        </FieldLabel>
                        <Input
                          {...field}
                          id='form-user-auth-email'
                          type='email'
                          aria-invalid={fieldState.invalid}
                          placeholder='Email'
                          autoComplete='off'
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                )}
                <Controller
                  name='password'
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor='form-user-auth-password'>
                        Password
                      </FieldLabel>
                      <Input
                        {...field}
                        id='form-user-auth-password'
                        type='password'
                        aria-invalid={fieldState.invalid}
                        placeholder='Password'
                        autoComplete='off'
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <FieldError errors={[form.formState.errors.root]} />
              </FieldGroup>
            </FieldSet>
          </form>
        </CardContent>
        <CardFooter>
          <Field orientation='responsive'>
            <LoadingButton
              type='submit'
              form='form-user-auth'
              disabled={form.formState.isSubmitting}
              loading={form.formState.isSubmitting}
            >
              {isRegister ? 'Sign up' : 'Log in'}
            </LoadingButton>
            {isRegister && (
              <Button
                type='button'
                onClick={onLoginClick}
                variant='link'
                className='underline'
              >
                Already have an account?
              </Button>
            )}
            {!isRegister && (
              <Button
                type='button'
                onClick={onRegisterClick}
                variant='secondary'
                className='underline'
              >
                Create an account
              </Button>
            )}
          </Field>
        </CardFooter>
      </Card>
    </div>
  )
}
