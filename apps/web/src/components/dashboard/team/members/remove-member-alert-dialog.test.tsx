import i18n from '@fuku/i18n/client'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DialogManager } from '~/components/providers/dialog-manager'
import { DialogId } from '~/lib/dialog'
import { useDialogStore } from '~/store/dialog.store'
import { render } from '~/test/utils'

const resolvedActiveTeam = {
  id: 'team-1',
}

const resolvedTeamMember = {
  id: 'member-1',
  givenNames: 'Test',
  familyName: 'User',
  rateMultiplier: 1,
  teamMemberRole: 'ADMIN',
  teamId: resolvedActiveTeam.id,
}

const { team, teamMember } = vi.hoisted(() => ({
  team: {
    getActiveTeam: vi.fn(),
  },
  teamMember: {
    byId: vi.fn(),
    restore: vi.fn(),
    delete: vi.fn(),
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
      restore: {
        mutationOptions: () => ({
          mutationFn: teamMember.restore,
        }),
      },
      delete: {
        mutationOptions: () => ({
          mutationFn: teamMember.delete,
        }),
      },
    },
  }),
}))

describe('removeMemberAlertDialog', () => {
  beforeEach(() => {
    vi.resetAllMocks()

    team.getActiveTeam.mockResolvedValue(resolvedActiveTeam)
    teamMember.byId.mockResolvedValue(resolvedTeamMember)
    teamMember.restore.mockResolvedValue(resolvedTeamMember)
    teamMember.delete.mockResolvedValue(resolvedTeamMember)

    useDialogStore.setState({
      open: true,
      isAlert: true,
      id: DialogId.REMOVE_TEAM_MEMBER,
      editingId: 'member-1',
    })
  })

  it('shows the alert dialog', () => {
    render(<DialogManager />)

    expect(screen.getByRole('heading', { name: i18n.t('removeTeamMember') })).toBeVisible()
    expect(screen.getByRole('button', { name: i18n.t('cancel') })).toBeVisible()
    expect(screen.getByRole('button', { name: i18n.t('remove') })).toBeVisible()
  })

  it('deletes member', async () => {
    render(<DialogManager />)

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: i18n.t('remove') }))

    expect(teamMember.delete).toHaveResolvedWith(
      expect.objectContaining({
        ...resolvedTeamMember,
      }),
    )
  })

  it('exits alert dialog on cancel button click', async () => {
    render(<DialogManager />)

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: i18n.t('cancel') }))

    expect(
      screen.queryByRole('heading', {
        name: i18n.t('removeTeamMember'),
      }),
    ).not.toBeInTheDocument()
  })
})
