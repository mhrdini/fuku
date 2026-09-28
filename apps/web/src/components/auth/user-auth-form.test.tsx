import i18n from '@fuku/i18n/client'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { render } from '~/test/utils'

import { UserAuthForm } from './user-auth-form'

const { signInUsername, signUpEmail, push } = vi.hoisted(() => ({
  signInUsername: vi.fn(),
  signUpEmail: vi.fn(),
  push: vi.fn(),
}))

vi.mock('~/auth/client', () => ({
  authClient: {
    signIn: {
      username: signInUsername,
    },
    signUp: {
      email: signUpEmail,
    },
  },
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push,
  }),
}))

describe('userAuthForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    signInUsername.mockResolvedValue(undefined)
    signUpEmail.mockResolvedValue(undefined)
  })

  describe('login', () => {
    it('renders username + password', () => {
      render(<UserAuthForm />)

      expect(screen.getByLabelText(i18n.t('username'))).toBeInTheDocument()
      expect(screen.getByLabelText(i18n.t('password'))).toBeInTheDocument()
    })

    it('does not render name/email', () => {
      render(<UserAuthForm />)

      expect(screen.queryByLabelText(i18n.t('email'))).not.toBeInTheDocument()
    })

    it('submits credentials to authClient.signIn.username', async () => {
      render(<UserAuthForm />)

      const user = userEvent.setup()

      const username = 'example'
      const password = 'password'

      await user.clear(screen.getByLabelText(i18n.t('username')))
      await user.type(screen.getByLabelText(i18n.t('username')), username)
      await user.clear(screen.getByLabelText(i18n.t('password')))
      await user.type(screen.getByLabelText(i18n.t('password')), password)

      await user.click(screen.getByRole('button', {
        name: i18n.t('logIn'),
      }))

      expect(signInUsername).toHaveBeenCalledWith(
        {
          username,
          password,
        },
        expect.objectContaining({
          onError: expect.any(Function),
          onSuccess: expect.any(Function),
        }),
      )
    })

    it('redirects to /[username] on success', async () => {
      render(<UserAuthForm />)

      const user = userEvent.setup()

      const username = 'example'

      await user.clear(screen.getByLabelText(i18n.t('username')))
      await user.type(screen.getByLabelText(i18n.t('username')), username)

      signInUsername.mockImplementation(async (_data, callbacks) => {
        callbacks.onSuccess()
      })

      await user.click(
        screen.getByRole('button', {
          name: i18n.t('logIn'),
        }),
      )

      expect(push).toHaveBeenCalledWith(`/${username}`)
    })

    it('shows the auth error on failure', async () => {
      render(<UserAuthForm />)

      const user = userEvent.setup()

      const username = 'example'
      const errorMessage = 'Error'

      await user.clear(screen.getByLabelText(i18n.t('username')))
      await user.type(screen.getByLabelText(i18n.t('username')), username)

      signInUsername.mockImplementation(async (_data, callbacks) => {
        callbacks.onError({
          error: {
            message: errorMessage,
          },
        })
      })

      await user.click(
        screen.getByRole('button', {
          name: i18n.t('logIn'),
        }),
      )

      expect(push).not.toHaveBeenCalled()
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })

    it('"create an account" navigates to /register', async () => {
      render(<UserAuthForm />)

      const user = userEvent.setup()

      await user.click(screen.getByRole('button', {
        name: i18n.t('createAnAccount'),
      }))

      expect(push).toHaveBeenCalledWith('/register')
    })

    it('validation prevents submission with invalid fields', async () => {
      render(<UserAuthForm />)

      const user = userEvent.setup()

      await user.clear(screen.getByLabelText(i18n.t('password')))
      await user.type(
        screen.getByLabelText(i18n.t('password')),
        '1234567',
      )

      await user.click(
        screen.getByRole('button', {
          name: i18n.t('logIn'),
        }),
      )

      expect(signInUsername).not.toHaveBeenCalled()
      expect(
        screen.getByText(i18n.t('invalid_password_length')),
      ).toBeInTheDocument()
    })
  })

  describe('register', () => {
    it('renders name + username + email + password', () => {
      render(<UserAuthForm register />)
      expect(screen.getByLabelText(i18n.t('name'))).toBeInTheDocument()
      expect(screen.getByLabelText(i18n.t('username'))).toBeInTheDocument()
      expect(screen.getByLabelText(i18n.t('email'))).toBeInTheDocument()
      expect(screen.getByLabelText(i18n.t('password'))).toBeInTheDocument()
    })

    it('submits registration data to authClient.signUp.email', async () => {
      render(<UserAuthForm register />)

      const name = 'Test User'
      const username = 'testuser'
      const email = 'test@example.com'
      const password = 'password'

      const user = userEvent.setup()

      await user.clear(screen.getByLabelText(i18n.t('name')))
      await user.type(screen.getByLabelText(i18n.t('name')), name)
      await user.clear(screen.getByLabelText(i18n.t('username')))
      await user.type(screen.getByLabelText(i18n.t('username')), username)
      await user.clear(screen.getByLabelText(i18n.t('email')))
      await user.type(screen.getByLabelText(i18n.t('email')), email)
      await user.clear(screen.getByLabelText(i18n.t('password')))
      await user.type(screen.getByLabelText(i18n.t('password')), password)

      await user.click(
        screen.getByRole('button', {
          name: i18n.t('signUp'),
        }),
      )

      expect(signUpEmail).toHaveBeenCalledWith(
        {
          name,
          username,
          email,
          password,
        },
        expect.objectContaining({
          onError: expect.any(Function),
          onSuccess: expect.any(Function),
        }),
      )
    })

    it('redirects to /[username] on success', async () => {
      render(<UserAuthForm register />)

      const user = userEvent.setup()

      const username = 'example'

      await user.clear(screen.getByLabelText(i18n.t('username')))
      await user.type(screen.getByLabelText(i18n.t('username')), username)

      signUpEmail.mockImplementation(async (_data, callbacks) => {
        callbacks.onSuccess()
      })

      await user.click(
        screen.getByRole('button', {
          name: i18n.t('signUp'),
        }),
      )

      expect(push).toHaveBeenCalledWith(`/${username}`)
    })

    it('shows the auth error on failure', async () => {
      render(<UserAuthForm register />)

      const user = userEvent.setup()
      const errorMessage = 'Error'

      signUpEmail.mockImplementation(async (_data, callbacks) => {
        callbacks.onError({
          error: {
            message: errorMessage,
          },
        })
      })

      await user.click(
        screen.getByRole('button', {
          name: i18n.t('signUp'),
        }),
      )

      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })

    it('"already have an account?" navigates to /login', async () => {
      render(<UserAuthForm register />)

      const user = userEvent.setup()

      await user.click(screen.getByRole('button', { name: i18n.t('alreadyHaveAnAccount') }))
    })

    it('validation prevents submission with invalid fields', async () => {
      render(<UserAuthForm register />)

      const user = userEvent.setup()

      await user.clear(screen.getByLabelText(i18n.t('email')))
      await user.type(
        screen.getByLabelText(i18n.t('email')),
        'not an email',
      )

      await user.click(
        screen.getByRole('button', {
          name: i18n.t('signUp'),
        }),
      )

      expect(signUpEmail).not.toHaveBeenCalled()

      await user.clear(screen.getByLabelText(i18n.t('email')))
      await user.type(
        screen.getByLabelText(i18n.t('email')),
        'test@example.com',
      )
      await user.clear(screen.getByLabelText(i18n.t('password')))
      await user.type(
        screen.getByLabelText(i18n.t('password')),
        '1234567',
      )

      await user.click(
        screen.getByRole('button', {
          name: i18n.t('signUp'),
        }),
      )

      expect(signUpEmail).not.toHaveBeenCalled()
      expect(
        screen.getByText(i18n.t('invalid_password_length')),
      ).toBeInTheDocument()
    })
  })
})
