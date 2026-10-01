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

const resolvedLocation = {
  id: 'location-1',
  name: 'Cafe',
  address: '1 Main Rd',
  teamId: resolvedActiveTeam.id,
  color: '#000000',
}

const { team, location } = vi.hoisted(() => ({
  team: {
    getActiveTeam: vi.fn(),
  },
  location: {
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
    location: {
      byId: {
        queryOptions: ({ id }: { id: string }) => ({
          queryKey: ['location', 'byId', id],
          queryFn: location.byId,
        }),
        queryKey: ({ id }: { id: string }) => [
          'location',
          'byId',
          id,
        ],
      },
      restore: {
        mutationOptions: () => ({
          mutationFn: location.restore,
        }),
      },
      delete: {
        mutationOptions: () => ({
          mutationFn: location.delete,
        }),
      },
    },
  }),
}))

describe('removeLocationAlertDialog', () => {
  beforeEach(() => {
    vi.resetAllMocks()

    team.getActiveTeam.mockResolvedValue(resolvedActiveTeam)
    location.byId.mockResolvedValue(resolvedLocation)
    location.restore.mockResolvedValue(resolvedLocation)
    location.delete.mockResolvedValue(resolvedLocation)

    useDialogStore.setState({
      open: true,
      isAlert: true,
      id: DialogId.REMOVE_LOCATION,
      editingId: 'location-1',
    })
  })

  it('shows the alert dialog', () => {
    render(<DialogManager />)

    expect(screen.getByRole('heading', { name: i18n.t('removeLocation') })).toBeVisible()
    expect(screen.getByRole('button', { name: i18n.t('cancel') })).toBeVisible()
    expect(screen.getByRole('button', { name: i18n.t('remove') })).toBeVisible()
  })

  it('deletes location', async () => {
    render(<DialogManager />)

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: i18n.t('remove') }))

    expect(location.delete).toHaveResolvedWith(
      expect.objectContaining({
        ...resolvedLocation,
      }),
    )
  })

  it('exits alert dialog on cancel button click', async () => {
    render(<DialogManager />)

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: i18n.t('cancel') }))

    expect(
      screen.queryByRole('heading', {
        name: i18n.t('removeLocation'),
      }),
    ).not.toBeInTheDocument()
  })
})
