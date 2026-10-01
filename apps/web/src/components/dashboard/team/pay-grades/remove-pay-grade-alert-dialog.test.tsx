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

const resolvedPayGrade = {
  id: 'pay-grade-1',
  name: 'Cafe',
  address: '1 Main Rd',
  teamId: resolvedActiveTeam.id,
  color: '#000000',
}

const { team, payGrade } = vi.hoisted(() => ({
  team: {
    getActiveTeam: vi.fn(),
  },
  payGrade: {
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
    payGrade: {
      byId: {
        queryOptions: ({ id }: { id: string }) => ({
          queryKey: ['payGrade', 'byId', id],
          queryFn: payGrade.byId,
        }),
        queryKey: ({ id }: { id: string }) => [
          'payGrade',
          'byId',
          id,
        ],
      },
      restore: {
        mutationOptions: () => ({
          mutationFn: payGrade.restore,
        }),
      },
      delete: {
        mutationOptions: () => ({
          mutationFn: payGrade.delete,
        }),
      },
    },
  }),
}))

describe('removeMemberAlertDialog', () => {
  beforeEach(() => {
    vi.resetAllMocks()

    team.getActiveTeam.mockResolvedValue(resolvedActiveTeam)
    payGrade.byId.mockResolvedValue(resolvedPayGrade)
    payGrade.restore.mockResolvedValue(resolvedPayGrade)
    payGrade.delete.mockResolvedValue(resolvedPayGrade)

    useDialogStore.setState({
      open: true,
      isAlert: true,
      id: DialogId.REMOVE_PAY_GRADE,
      editingId: 'pay-grade-1',
    })
  })

  it('shows the alert dialog', () => {
    render(<DialogManager />)

    expect(screen.getByRole('heading', { name: i18n.t('removePayGrade') })).toBeVisible()
    expect(screen.getByRole('button', { name: i18n.t('cancel') })).toBeVisible()
    expect(screen.getByRole('button', { name: i18n.t('remove') })).toBeVisible()
  })

  it('deletes pay grade', async () => {
    render(<DialogManager />)

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: i18n.t('remove') }))

    expect(payGrade.delete).toHaveResolvedWith(
      expect.objectContaining({
        ...resolvedPayGrade,
      }),
    )
  })

  it('exits alert dialog on cancel button click', async () => {
    render(<DialogManager />)

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: i18n.t('cancel') }))

    expect(
      screen.queryByRole('heading', {
        name: i18n.t('removePayGrade'),
      }),
    ).not.toBeInTheDocument()
  })
})
