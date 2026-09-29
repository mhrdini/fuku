import i18n from '@fuku/i18n/client'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { render } from '~/test/utils'

import { LogOutButton } from './log-out-button'

const { signOut, push } = vi.hoisted(() => ({
  signOut: vi.fn(),
  push: vi.fn(),
}))

vi.mock('~/auth/client', () => ({
  authClient: {
    signOut,
  },
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push,
  }),
}))

describe('logOutButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    signOut.mockResolvedValue(undefined)
  })

  it('renders the log out button', () => {
    render(<LogOutButton />)

    expect(
      screen.getByRole('button', { name: i18n.t('logOut') }),
    ).toBeInTheDocument()
  })

  it('signs out and redirects to the home page', async () => {
    const user = userEvent.setup()

    render(<LogOutButton />)

    await user.click(
      screen.getByRole('button', { name: i18n.t('logOut') }),
    )

    expect(signOut).toHaveBeenCalledOnce()
    expect(push).toHaveBeenCalledWith('/')
  })
})
