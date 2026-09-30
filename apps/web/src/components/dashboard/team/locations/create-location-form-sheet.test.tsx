import i18n from '@fuku/i18n/client'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SheetManager } from '~/components/providers/sheet-manager'
import { SheetId } from '~/lib/sheet'
import { useSheetStore } from '~/store/sheet.store'
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
    create: vi.fn(),
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
      create: {
        mutationOptions: () => ({
          mutationFn: location.create,
        }),
      },
    },
  }),
}))

describe('createLocationFormSheet', () => {
  beforeEach(() => {
    vi.resetAllMocks()

    team.getActiveTeam.mockResolvedValue(resolvedActiveTeam)
    location.create.mockResolvedValue(resolvedLocation)

    useSheetStore.setState({
      open: true,
      id: SheetId.CREATE_LOCATION,
    })
  })

  it('shows the sheet form', () => {
    render(<SheetManager />)

    expect(screen.getByRole('heading', {
      name: i18n.t('createNewLocation'),
    })).toBeVisible()

    expect(screen.getByRole('textbox', {
      name: i18n.t('name'),
    }))

    expect(screen.getByRole('textbox', {
      name: i18n.t('address'),
    }))

    expect(screen.getByRole('button', {
      name: new RegExp(i18n.t('createLocation')),
    }))
  })

  it('closes on sheet close', async () => {
    render(<SheetManager />)

    const user = userEvent.setup()

    await user.click(screen.getByRole('button', {
      name: 'Close',
    }))

    expect(
      screen.queryByRole('heading', {
        name: i18n.t('createNewLocation'),
      }),
    ).not.toBeInTheDocument()
  })

  it('creates location', async () => {
    render(<SheetManager />)

    const user = userEvent.setup()

    await user.type(screen.getByRole('textbox', {
      name: i18n.t('name'),
    }), resolvedLocation.name)

    await user.type(screen.getByRole('textbox', {
      name: i18n.t('address'),
    }), resolvedLocation.address)

    await user.click(screen.getByRole('button', {
      name: new RegExp(i18n.t('createLocation')),
    }))

    expect(location.create).toHaveBeenCalledWith(expect.objectContaining({
      name: resolvedLocation.name,
      address: resolvedLocation.address,
      teamId: resolvedLocation.teamId,
    }), expect.anything())
  })

  it('shows error and no submission when missing location name', async () => {
    render(<SheetManager />)

    const user = userEvent.setup()

    await user.click(screen.getByRole('button', {
      name: new RegExp(i18n.t('createLocation')),
    }))

    expect(await screen.findByText('invalid_location_name')).toBeVisible()
    expect(location.create).not.toHaveBeenCalled()
  })
})
