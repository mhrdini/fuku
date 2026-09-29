import i18n from '@fuku/i18n/client'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DialogManager } from '~/components/providers/dialog-manager'
import { DialogId } from '~/lib/dialog'
import { useDialogStore } from '~/store/dialog.store'
import { render } from '~/test/utils'

const resolvedUser = {
  id: 'user-1',
  username: 'testuser',
}

const resolvedActiveTeam = {
  id: 'team-1',
}

const resolvedPayGrades = [
  {
    id: 'pay-grade-1',
    name: 'Employee',
    baseRate: 1200,
  },
  {
    id: 'pay-grade-2',
    name: 'Manager',
    baseRate: 1500,
  },
]

const resolvedTeamMember = {
  id: 'member-1',
  givenNames: 'Test',
  familyName: 'User',
  rateMultiplier: 1,
  teamMemberRole: 'ADMIN',
  teamId: resolvedActiveTeam.id,
  payGradeId: resolvedPayGrades[0].id,
  payGrade: resolvedPayGrades[0],
  userId: resolvedUser.id,
  user: resolvedUser,
}

const { team, payGrade, teamMember } = vi.hoisted(() => ({
  team: {
    getActiveTeam: vi.fn(),
  },
  payGrade: {
    list: vi.fn(),
  },
  teamMember: {
    byId: vi.fn(),
    update: vi.fn(),
  },
}))

vi.mock('~/trpc/client', () => ({
  useTRPC: () => ({
    team: {
      getActiveTeam: {
        queryOptions: () => ({
          queryKey: ['team', 'getActiveTeam'],
          queryFn: team.getActiveTeam,
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
      byId: {
        queryOptions: ({ id }: { id: string }) => ({
          queryKey: ['teamMember', 'byId', id],
          queryFn: teamMember.byId,
        }),
        queryKey: ({ id }: { id: string }) => [
          'teamMember',
          'byId',
          id,
        ],
      },
      update: {
        mutationOptions: () => ({
          mutationFn: teamMember.update,
        }),
      },
    },
  }),
}))

describe('updateMemberFormDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    team.getActiveTeam.mockResolvedValue(resolvedActiveTeam)
    payGrade.list.mockResolvedValue(resolvedPayGrades)
    teamMember.byId.mockResolvedValue(resolvedTeamMember)
    teamMember.update.mockResolvedValue(resolvedTeamMember)

    useDialogStore.setState({
      open: true,
      isAlert: false,
      id: DialogId.UPDATE_TEAM_MEMBER,
      editingId: 'member-1',
    })
  })

  it('shows the form', async () => {
    render(<DialogManager />)

    expect(
      screen.getByRole('heading', {
        name: i18n.t('editTeamMember'),
      }),
    )

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

  it('returns to form when choosing to keep editing', async () => {
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

    await user.click(
      screen.getByRole('button', {
        name: i18n.t('keepEditing'),
      }),
    )

    expect(
      screen.queryByText(i18n.t('discardChanges')),
    ).not.toBeInTheDocument()

    expect(
      screen.getByRole('heading', {
        name: i18n.t('editTeamMember'),
      }),
    ).toBeVisible()
  })

  it('closes all dialog when choosing to discard', async () => {
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

    await user.click(
      screen.getByRole('button', {
        name: i18n.t('discard'),
      }),
    )

    expect(
      screen.queryByText(i18n.t('discardChanges')),
    ).not.toBeInTheDocument()

    expect(
      screen.queryByRole('heading', {
        name: i18n.t('editTeamMember'),
      }),
    ).not.toBeInTheDocument()
  })

  it('disallows saving when no changes were made', async () => {
    render(<DialogManager />)

    const user = userEvent.setup()

    const saveButton = screen.getByRole('button', {
      name: new RegExp(i18n.t('save', 'Save')),
    })

    await user.click(saveButton)

    expect(teamMember.update).not.toHaveBeenCalled()
    expect(saveButton).toBeDisabled()
  })

  it('updates the team member successfully', async () => {
    const updatedTeamMember = {
      id: resolvedTeamMember.id,
      givenNames: `${resolvedTeamMember.givenNames} Updated`,
      familyName: resolvedTeamMember.familyName,
      teamId: resolvedActiveTeam.id,
      payGradeId: resolvedTeamMember.payGradeId,
      rateMultiplier: resolvedTeamMember.rateMultiplier,
      username: resolvedUser.username,
    }
    teamMember.update.mockResolvedValue(updatedTeamMember)

    render(<DialogManager />)

    const user = userEvent.setup()

    const givenNamesInput = screen.getByRole('textbox', {
      name: i18n.t('givenNames', 'Given Name(s)'),
    })

    await user.type(givenNamesInput, ' Updated')

    await user.click(
      screen.getByRole('button', {
        name: new RegExp(i18n.t('save', 'Save')),
      }),
    )

    expect(teamMember.update).toHaveBeenCalledWith(
      expect.objectContaining({
        ...updatedTeamMember,
      }),
      expect.anything(),
    )

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        i18n.t('teamMember'),
        {
          description: i18n.t(
            'givennamesFamilynameHasBeenUpdated',
            '{{givenNames}} {{familyName}} has been updated.',
            {
              givenNames: updatedTeamMember.givenNames,
              familyName: updatedTeamMember.familyName,
            },
          ),
        },
      )

      expect(useDialogStore.getState().open).toBe(false)
    })
  })

  it('shows an error when updating the team member fails', async () => {
    teamMember.update.mockRejectedValue({
      data: {
        httpStatus: 409,
      },
      message: 'Username already exists',
    })

    render(<DialogManager />)

    const user = userEvent.setup()

    const givenNamesInput = screen.getByRole('textbox', {
      name: i18n.t('givenNames', 'Given Name(s)'),
    })

    await user.type(givenNamesInput, ' Updated')

    await user.click(
      screen.getByRole('button', {
        name: new RegExp(i18n.t('save', 'Save')),
      }),
    )

    expect(teamMember.update).toHaveBeenCalled()

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        i18n.t('error'),
        {
          description: i18n.t('valMessage', '{{val}}: {{message}}', {
            val: ' (409)',
            message: 'Username already exists',
          }),
        },
      )

      expect(useDialogStore.getState().open).toBe(true)
    })
  })
})
