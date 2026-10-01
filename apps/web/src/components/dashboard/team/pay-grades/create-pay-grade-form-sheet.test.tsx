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

const resolvedPayGrade = {
  id: 'pay-grade-1',
  name: 'Cafe',
  address: '1 Main Rd',
  teamId: resolvedActiveTeam.id,
  color: '#000000',
}

const { team, shiftType, payGrade } = vi.hoisted(() => ({
  team: {
    getActiveTeam: vi.fn(),
  },
  shiftType: {
    list: vi.fn(),
  },
  payGrade: {
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
    shiftType: {
      list: {
        queryOptions: ({ teamId }: { teamId: string }) => ({
          queryKey: ['shiftType', 'list', teamId],
          queryFn: shiftType.list,
        }),
      },
    },
    payGrade: {
      create: {
        mutationOptions: () => ({
          mutationFn: payGrade.create,
        }),
      },
    },
  }),
}))

describe('createPayGradeFormSheet', () => {
  beforeEach(() => {
    vi.resetAllMocks()

    team.getActiveTeam.mockResolvedValue(resolvedActiveTeam)
    payGrade.create.mockResolvedValue(resolvedPayGrade)

    useSheetStore.setState({
      open: true,
      id: SheetId.CREATE_PAY_GRADE,
    })
  })

  it('shows the sheet form', () => {
    render(<SheetManager />)

    expect(screen.getByRole('heading', {
      name: i18n.t('createNewPayGrade'),
    })).toBeVisible()

    expect(screen.getByRole('textbox', {
      name: i18n.t('name'),
    }))

    expect(screen.getByRole('spinbutton', {
      name: i18n.t('baseRate'),
    }))

    expect(screen.getByRole('spinbutton', {
      name: i18n.t('baseRate'),
    }))

    expect(screen.getByRole('combobox', {
      name: i18n.t('eligibleShiftTypes'),
    }))

    expect(screen.getByRole('button', {
      name: new RegExp(i18n.t('create')),
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
        name: i18n.t('createNewPayGrade'),
      }),
    ).not.toBeInTheDocument()
  })

  it('creates payGrade', async () => {
    render(<SheetManager />)

    const user = userEvent.setup()

    await user.type(screen.getByRole('textbox', {
      name: i18n.t('name'),
    }), resolvedPayGrade.name)

    await user.click(screen.getByRole('button', {
      name: new RegExp(i18n.t('create')),
    }))

    expect(payGrade.create).toHaveBeenCalledWith(expect.objectContaining({
      name: resolvedPayGrade.name,
      teamId: resolvedPayGrade.teamId,
    }), expect.anything())
  })

  it('shows error and no submission when missing pay grade name', async () => {
    render(<SheetManager />)

    const user = userEvent.setup()

    await user.click(screen.getByRole('button', {
      name: new RegExp(i18n.t('create')),
    }))

    expect(await screen.findByText('invalid_pay_grade_name')).toBeVisible()
    expect(payGrade.create).not.toHaveBeenCalled()
  })
})
