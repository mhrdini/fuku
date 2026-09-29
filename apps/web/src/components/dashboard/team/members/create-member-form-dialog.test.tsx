import i18n from '@fuku/i18n/client'
import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DialogManager } from '~/components/providers/dialog-manager'
import { DialogId } from '~/lib/dialog'
import { useDialogStore } from '~/store/dialog.store'
import { render } from '~/test/utils'

const { getActiveTeam, payGrade, teamMember } = vi.hoisted(() => ({
  getActiveTeam: vi.fn(),
  payGrade: {
    list: vi.fn(),
  },
  teamMember: {
    create: vi.fn(),
  },
}))

vi.mock('~/trpc/client', () => ({
  useTRPC: () => ({
    team: {
      getActiveTeam: {
        queryOptions: () => ({
          queryKey: ['team', 'getActiveTeam'],
          queryFn: getActiveTeam,
        }),
      },
    },
    payGrade: {
      list: {
        queryOptions: ({ teamId }: { teamId: string }) => ({
          queryKey: ['payGrade', 'list', teamId],
          queryFn: payGrade.list,
        }),
      },
    },
    teamMember: {
      create: {
        mutationOptions: () => ({
          mutationFn: teamMember.create,
        }),
      },
    },
  }),
}))

vi.mock('@fuku/ui/components', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@fuku/ui/components')>()

  return {
    ...actual,
    Command: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    CommandEmpty: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    CommandGroup: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    CommandList: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    CommandItem: ({
      children,
      onSelect,
    }: {
      children: React.ReactNode
      onSelect?: (value: string) => void
    }) => (
      <button
        type='button'
        onClick={() => onSelect?.('pg-id-1')}
      >
        {children}
      </button>
    ),
  }
})

describe('createMemberFormDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    getActiveTeam.mockResolvedValue({
      id: 'team-id',
    })

    payGrade.list.mockResolvedValue([
      {
        id: 'pg-id-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        name: 'Manager',
        description: null,
        teamId: 'team-id',
        baseRate: 1000,
        eligibleShiftTypes: [],
      },
      {
        id: 'pg-id-2',
        createdAt: new Date(),
        updatedAt: new Date(),
        name: 'Employee',
        description: null,
        teamId: 'team-id',
        baseRate: 500,
        eligibleShiftTypes: [],
      },
    ])

    teamMember.create.mockResolvedValue({
      id: 'member-id',
    })

    act(() => {
      useDialogStore.setState({
        open: true,
        isAlert: false,
        id: DialogId.CREATE_TEAM_MEMBER,
      })
    })
  })

  it('shows the form', async () => {
    render(<DialogManager />)

    expect(
      screen.getByRole('heading', {
        name: i18n.t('newTeamMember2', 'New Team Member'),
      }),
    ).toBeVisible()

    expect(
      screen.getByRole('textbox', {
        name: i18n.t('givenNames', 'Given Name(s)'),
      }),
    ).toBeVisible()

    expect(
      screen.getByRole('textbox', {
        name: i18n.t('lastName', 'Last Name'),
      }),
    ).toBeVisible()

    expect(
      screen.getByRole('combobox', {
        name: i18n.t('payGrade', 'Pay Grade'),
      }),
    ).toBeVisible()

    expect(
      screen.getByRole('spinbutton', {
        name: i18n.t('multiplier', 'Multiplier'),
      }),
    ).toBeVisible()

    expect(
      screen.getByRole('textbox', {
        name: i18n.t('linkedAccount', 'Linked Account'),
      }),
    ).toBeVisible()
  })

  it('closes the form when cancelled without changes', async () => {
    render(<DialogManager />)

    const user = userEvent.setup()

    await user.click(
      screen.getByRole('button', {
        name: i18n.t('cancel', 'Cancel'),
      }),
    )

    expect(useDialogStore.getState().open).toBe(false)
  })

  it('shows a discard confirmation when cancelled with changes', async () => {
    render(<DialogManager />)

    const user = userEvent.setup()

    await user.type(
      screen.getByRole('textbox', {
        name: i18n.t('givenNames', 'Given Name(s)'),
      }),
      'Test',
    )

    await user.click(
      screen.getByRole('button', {
        name: i18n.t('cancel', 'Cancel'),
      }),
    )

    expect(
      screen.getByRole('alertdialog'),
    ).toBeVisible()
  })

  it('shows validation errors for empty required fields', async () => {
    render(<DialogManager />)

    const user = userEvent.setup()

    await user.click(
      screen.getByRole('button', {
        name: i18n.t('create', 'Create'),
      }),
    )

    expect(
      screen.getByText(i18n.t('invalid_given_names')),
    ).toBeVisible()
  })

  // it('shows validation errors for an invalid multiplier', async () => {
  //   render(<DialogManager />)

  //   const user = userEvent.setup()

  //   await user.type(
  //     screen.getByRole('textbox', {
  //       name: i18n.t('givenNames', 'Given Name(s)'),
  //     }),
  //     'Test',
  //   )

  //   await user.type(
  //     screen.getByRole('textbox', {
  //       name: i18n.t('lastName', 'Last Name'),
  //     }),
  //     'User',
  //   )

  //   const multiplier = screen.getByRole('spinbutton', {
  //     name: i18n.t('multiplier', 'Multiplier'),
  //   })

  //   await user.clear(multiplier)
  //   await user.type(multiplier, '-1')

  //   await user.click(
  //     screen.getByRole('button', {
  //       name: i18n.t('create', 'Create'),
  //     }),
  //   )

  //   expect(
  //     screen.getByText(i18n.t('invalid_rate_multiplier')),
  //   ).toBeVisible()
  // })

  it('submits with valid input', async () => {
    render(<DialogManager />)

    const user = userEvent.setup()

    await user.type(
      screen.getByRole('textbox', {
        name: i18n.t('givenNames', 'Given Name(s)'),
      }),
      'Test',
    )

    await user.type(
      screen.getByRole('textbox', {
        name: i18n.t('lastName', 'Last Name'),
      }),
      'User',
    )

    await user.click(
      screen.getByRole('combobox', {
        name: i18n.t('payGrade', 'Pay Grade'),
      }),
    )

    await user.click(
      screen.getByRole('button', {
        name: 'Manager',
      }),
    )

    await user.click(
      screen.getByRole('button', {
        name: i18n.t('create', 'Create'),
      }),
    )

    await waitFor(() => {
      expect(teamMember.create).toHaveBeenCalledWith(
        expect.objectContaining({
          givenNames: 'Test',
          familyName: 'User',
          teamMemberRole: 'STAFF',
          teamId: 'team-id',
          rateMultiplier: 1,
          payGradeId: 'pg-id-1',
        }),
        expect.anything(),
      )
    })
  })
})
