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

const resolvedShiftType = {
  id: 'shift-type-1',
  name: 'Cafe',
  startTime: '09:00',
  endTime: '17:00',
  teamId: resolvedActiveTeam.id,
}

const { team, shiftType } = vi.hoisted(() => ({
  team: {
    getActiveTeam: vi.fn(),
  },
  shiftType: {
    byId: vi.fn(),
    restore: vi.fn(),
    delete: vi.fn(),
    listIds: vi.fn(),
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
    shiftType: {
      byId: {
        queryOptions: ({ id }: { id: string }) => ({
          queryKey: ['shiftType', 'byId', id],
          queryFn: shiftType.byId,
        }),
      },
      restore: {
        mutationOptions: () => ({
          mutationFn: shiftType.restore,
        }),
      },
      delete: {
        mutationOptions: () => ({
          mutationFn: shiftType.delete,
        }),
      },
      listIds: {
        queryOptions: ({ teamId }: { teamId: string }) => ({
          queryKey: ['shiftType', 'listIds', teamId],
          queryFn: shiftType.listIds,
        }),
      },
    },
  }),
}))

describe('removeShiftTypeAlertDialog', () => {
  beforeEach(() => {
    vi.resetAllMocks()

    team.getActiveTeam.mockResolvedValue(resolvedActiveTeam)
    shiftType.byId.mockResolvedValue(resolvedShiftType)
    shiftType.restore.mockResolvedValue(resolvedShiftType)
    shiftType.delete.mockResolvedValue(resolvedShiftType)

    useDialogStore.setState({
      open: true,
      isAlert: true,
      id: DialogId.REMOVE_SHIFT_TYPE,
      editingId: 'shift-type-1',
    })
  })

  it('shows the alert dialog', () => {
    render(<DialogManager />)

    expect(screen.getByRole('heading', { name: i18n.t('removeShiftType') })).toBeVisible()
    expect(screen.getByRole('button', { name: i18n.t('cancel') })).toBeVisible()
    expect(screen.getByRole('button', { name: i18n.t('remove') })).toBeVisible()
  })

  it('deletes shift type', async () => {
    render(<DialogManager />)

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: i18n.t('remove') }))

    expect(shiftType.delete).toHaveResolvedWith(
      expect.objectContaining({
        ...resolvedShiftType,
      }),
    )
  })

  it('exits alert dialog on cancel button click', async () => {
    render(<DialogManager />)

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: i18n.t('cancel') }))

    expect(
      screen.queryByRole('heading', {
        name: i18n.t('removeShiftType'),
      }),
    ).not.toBeInTheDocument()
  })
})
