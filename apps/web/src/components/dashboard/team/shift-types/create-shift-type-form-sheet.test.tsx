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

const resolvedPayGrades = [
  {
    id: 'pay-grade-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    name: 'Manager',
    description: null,
    teamId: 'team-1',
    baseRate: 1000,
    eligibleShiftTypes: [],
  },
  {
    id: 'pay-grade-2',
    createdAt: new Date(),
    updatedAt: new Date(),
    name: 'Employee',
    description: null,
    teamId: 'team-1',
    baseRate: 500,
    eligibleShiftTypes: [],
  },
]

const resolvedShiftType = {
  id: 'shift-type-1',
  name: 'Cafe',
  startTime: '09:00',
  endTime: '17:00',
  teamId: resolvedActiveTeam.id,
}

const { team, payGrade, shiftType } = vi.hoisted(() => ({
  team: {
    getActiveTeam: vi.fn(),
  },
  payGrade: {
    list: vi.fn(),
  },
  shiftType: {
    create: vi.fn(),
    byId: vi.fn(),
    listIds: vi.fn(),
    list: vi.fn(),
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
    shiftType: {
      create: {
        mutationOptions: () => ({
          mutationFn: shiftType.create,
        }),
      },
      byId: {
        queryOptions: ({ id }: { id: string }) => ({
          queryKey: ['shiftType', 'byId', id],
          queryFn: shiftType.byId,
        }),
      },
      listIds: {
        queryOptions: ({ teamId }: { teamId: string }) => ({
          queryKey: ['shiftType', 'listIds', teamId],
          queryFn: shiftType.listIds,
        }),
      },
      list: {
        queryOptions: ({ teamId }: { teamId: string }) => ({
          queryKey: ['shiftType', 'list', teamId],
          queryFn: shiftType.list,
        }),
      },
    },
  }),
}))

describe('createShiftTypeFormSheet', () => {
  beforeEach(() => {
    vi.resetAllMocks()

    team.getActiveTeam.mockResolvedValue(resolvedActiveTeam)
    payGrade.list.mockResolvedValue(resolvedPayGrades)
    shiftType.create.mockResolvedValue(resolvedShiftType)

    useSheetStore.setState({
      open: true,
      id: SheetId.CREATE_SHIFT_TYPE,
    })
  })

  it('shows the sheet form', () => {
    render(<SheetManager />)

    expect(screen.getByRole('heading', {
      name: i18n.t('createNewShiftType'),
    })).toBeVisible()

    expect(screen.getByRole('textbox', {
      name: i18n.t('name'),
    }))

    expect(screen.getByText(i18n.t('startTime')))

    expect(screen.getByText(i18n.t('endTime')))

    expect(screen.getByRole('combobox', {
      name: i18n.t('eligiblePayGrades'),
    }))

    expect(screen.getByRole('button', {
      name: new RegExp(i18n.t('createShiftType')),
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
        name: i18n.t('createNewShiftType'),
      }),
    ).not.toBeInTheDocument()
  })

  it('creates shift type', async () => {
    render(<SheetManager />)

    const user = userEvent.setup()

    await user.type(screen.getByRole('textbox', {
      name: i18n.t('name'),
    }), resolvedShiftType.name)

    await user.click(screen.getByRole('button', {
      name: new RegExp(i18n.t('createShiftType')),
    }))

    expect(shiftType.create).toHaveBeenCalledWith(expect.objectContaining({
      name: resolvedShiftType.name,
      teamId: resolvedShiftType.teamId,
    }), expect.anything())
  })

  it('shows error and no submission when missing shift type name', async () => {
    render(<SheetManager />)

    const user = userEvent.setup()

    await user.click(screen.getByRole('button', {
      name: new RegExp(i18n.t('createShiftType')),
    }))

    expect(await screen.findByText('invalid_shift_type_name')).toBeVisible()
    expect(shiftType.create).not.toHaveBeenCalled()
  })
})
