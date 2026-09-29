import i18n from '@fuku/i18n/client'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useTeamStore } from '~/store/team.store'
import { render } from '~/test/utils'

import { TeamSelectDropdownMenu } from './team-select-dropdown-menu'

const { push, getSidebarState, setLastActiveTeam } = vi.hoisted(() => ({
  push: vi.fn(),
  getSidebarState: vi.fn(),
  setLastActiveTeam: vi.fn(),
}))

const noTeamsSidebarState = {
  activeTeam: null,
  teams: [],
}

const hasTeamsSidebarState = {
  activeTeam: {
    id: 'team-1',
    publicId: 'team-one',
    name: 'Team One',
    teamMembersCount: 3,
  },
  teams: [
    {
      id: 'team-1',
      publicId: 'team-one',
      name: 'Team One',
      teamMembersCount: 3,
    },
    {
      id: 'team-2',
      publicId: 'team-two',
      name: 'Team Two',
      teamMembersCount: 5,
    },
  ],
}

vi.mock('next/navigation', () => ({
  useParams: () => ({
    username: 'testuser',
  }),
  useRouter: () => ({
    push,
  }),
}))

vi.mock('~/trpc/client', () => ({
  useTRPC: () => ({
    user: {
      getSidebarState: {
        queryOptions: () => ({
          queryKey: ['user', 'getSidebarState'],
          queryFn: getSidebarState,
        }),
      },
      setLastActiveTeam: {
        mutationOptions: () => ({
          mutationFn: setLastActiveTeam,
        }),
      },
    },
  }),
}))

async function openTeamMenu(user: ReturnType<typeof userEvent.setup>) {
  const trigger = await screen.findByRole('button', {
    name: new RegExp(hasTeamsSidebarState.activeTeam.name),
  })

  trigger.focus()
  await user.keyboard('{Enter}')

  return trigger
}

describe('teamSelectDropdownMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getSidebarState.mockResolvedValue(hasTeamsSidebarState)
    setLastActiveTeam.mockResolvedValue(undefined)
  })

  it('renders the active team', async () => {
    render(<TeamSelectDropdownMenu />)

    expect(
      await screen.findByRole('button', {
        name: /Team One/,
      }),
    ).toBeInTheDocument()

    expect(
      await screen.findByText(
        i18n.t('teamMembersCounter', {
          count: hasTeamsSidebarState.activeTeam.teamMembersCount,
        }),
      ),
    ).toBeInTheDocument()
  })

  it('renders available teams when clicked', async () => {
    const user = userEvent.setup()
    render(<TeamSelectDropdownMenu />)

    await openTeamMenu(user)

    expect(
      await screen.findByRole('menuitem', {
        name: hasTeamsSidebarState.teams[0].name,
      }),
    ).toBeInTheDocument()

    expect(
      await screen.findByRole('menuitem', {
        name: hasTeamsSidebarState.teams[1].name,
      }),
    ).toBeInTheDocument()
  })

  it('selects a different team to update active team', async () => {
    const user = userEvent.setup()

    render(<TeamSelectDropdownMenu />)

    await openTeamMenu(user)

    await user.click(
      await screen.findByRole('menuitem', {
        name: hasTeamsSidebarState.teams[1].name,
      }),
    )

    expect(useTeamStore.getState().activeTeamId).toBe(
      hasTeamsSidebarState.teams[1].id,
    )
  })

  it('persists the selected team', async () => {
    const user = userEvent.setup()

    render(<TeamSelectDropdownMenu />)

    await openTeamMenu(user)

    await user.click(
      await screen.findByRole('menuitem', {
        name: hasTeamsSidebarState.teams[1].name,
      }),
    )

    expect(setLastActiveTeam).toHaveBeenCalledWith(
      { teamId: hasTeamsSidebarState.teams[1].id },
      expect.anything(),
    )
  })

  it('navigates to the selected team', async () => {
    const user = userEvent.setup()

    render(<TeamSelectDropdownMenu />)

    await openTeamMenu(user)

    await user.click(
      await screen.findByRole('menuitem', {
        name: hasTeamsSidebarState.teams[1].name,
      }),
    )

    expect(push).toHaveBeenCalledWith(
      `/testuser/team/${hasTeamsSidebarState.teams[1].publicId}`,
    )
  })

  it('navigates to create a new team', async () => {
    const user = userEvent.setup()

    render(<TeamSelectDropdownMenu />)

    await openTeamMenu(user)

    await user.click(
      await screen.findByRole('menuitem', {
        name: i18n.t('createANewTeam', 'Create a new team'),
      }),
    )

    expect(push).toHaveBeenCalledWith('/testuser/team/new')
  })

  it('navigates to create the first team when there are no teams', async () => {
    getSidebarState.mockResolvedValue(noTeamsSidebarState)

    const user = userEvent.setup()

    render(<TeamSelectDropdownMenu />)

    await user.click(
      await screen.findByRole('button', {
        name: i18n.t('createYourFirstTeam', 'Create your first team'),
      }),
    )

    expect(push).toHaveBeenCalledWith('/testuser/team/new')
  })
})
