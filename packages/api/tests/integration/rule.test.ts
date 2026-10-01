import {

  testDb,
} from '@fuku/db/testing'
import {
  createPayGrade,
  createRule,
  createShiftType,
  createTeam,
  createUser,
} from '@fuku/db/testing/factories'
import { describe, expect, it } from 'vitest'

import { createCaller } from '../helpers/caller'
import { createSessionContext } from '../helpers/context'

describe('rule', () => {
  describe('list', () => {
    it('returns rules for the team', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const rule = await createRule(team.id)

      const caller = createCaller({
        session: createSessionContext(user),
      })

      await expect(
        caller.rule.list({ teamId: team.id }),
      ).resolves.toEqual([expect.objectContaining({ id: rule.id })])
    })

    it('excludes rules from other teams', async () => {
      const user = await createUser()
      const otherUser = await createUser()
      const team = await createTeam(user.id)
      const otherTeam = await createTeam(otherUser.id)

      await createRule(team.id)
      const otherRule = await createRule(otherTeam.id)

      const caller = createCaller({
        session: createSessionContext(user),
      })

      const rules = await caller.rule.list({ teamId: team.id })

      expect(rules).not.toContainEqual(
        expect.objectContaining({ id: otherRule.id }),
      )
    })
  })

  describe('groupById', () => {
    it('groups rules by id', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const rule = await createRule(team.id)

      const caller = createCaller({
        session: createSessionContext(user),
      })

      const rules = await caller.rule.groupById({
        teamId: team.id,
      })

      expect(rules[rule.id]).toEqual(
        expect.objectContaining({ id: rule.id }),
      )
    })

    it('returns an empty object when the team has no rules', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)

      const caller = createCaller({
        session: createSessionContext(user),
      })

      await expect(
        caller.rule.groupById({ teamId: team.id }),
      ).resolves.toEqual({})
    })
  })

  describe('byPayGrade', () => {
    it('returns rules for the pay grade', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const payGrade = await createPayGrade(team.id)
      const rule = await createRule(team.id, {
        payGradeId: payGrade.id,
      })

      const caller = createCaller({
        session: createSessionContext(user),
      })

      await expect(
        caller.rule.byPayGrade({
          payGradeId: payGrade.id,
        }),
      ).resolves.toEqual([expect.objectContaining({ id: rule.id })])
    })

    it('excludes rules for other pay grades', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const payGrade = await createPayGrade(team.id)
      const otherPayGrade = await createPayGrade(team.id)

      const rule = await createRule(team.id, {
        payGradeId: otherPayGrade.id,
      })

      const caller = createCaller({
        session: createSessionContext(user),
      })

      const rules = await caller.rule.byPayGrade({
        payGradeId: payGrade.id,
      })

      expect(rules).not.toContainEqual(
        expect.objectContaining({ id: rule.id }),
      )
    })
  })

  describe('byShiftType', () => {
    it('returns rules for the shift type', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const shiftType = await createShiftType(team.id)
      const rule = await createRule(team.id, {
        shiftTypeId: shiftType.id,
      })

      const caller = createCaller({
        session: createSessionContext(user),
      })

      await expect(
        caller.rule.byShiftType({
          shiftTypeId: shiftType.id,
        }),
      ).resolves.toEqual([expect.objectContaining({ id: rule.id })])
    })
  })

  describe('byTeamMember', () => {
    it('returns rules for the team member', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const caller = createCaller({
        session: createSessionContext(user),
      })
      const member = (await caller.user.getMyMemberships())[0]
      const rule = await createRule(team.id, {
        teamMemberId: member.id,
      })

      await expect(
        caller.rule.byTeamMember({
          teamMemberId: member.id,
        }),
      ).resolves.toEqual([expect.objectContaining({ id: rule.id })])
    })
  })

  describe('create', () => {
    it('creates a rule', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)

      const caller = createCaller({
        session: createSessionContext(user),
      })

      const result = await caller.rule.create({
        teamId: team.id,
        scope: 'GLOBAL',
        metric: 'DAYS_WORKED',
        timeWindow: 'PER_WEEK',
        operator: 'MAX',
        threshold: 5,
        hardConstraint: true,
        penalty: 10,
        active: true,
        payGradeId: null,
        teamMemberId: null,
        shiftTypeId: null,
      })

      expect(result).toEqual(
        expect.objectContaining({
          teamId: team.id,
          scope: 'GLOBAL',
          metric: 'DAYS_WORKED',
          timeWindow: 'PER_WEEK',
          operator: 'MAX',
          threshold: 5,
          hardConstraint: true,
          penalty: 10,
          active: true,
        }),
      )
    })
  })

  describe('update', () => {
    it('updates a rule', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const rule = await createRule(team.id)

      const caller = createCaller({
        session: createSessionContext(user),
      })

      const result = await caller.rule.update({
        id: rule.id,
        scope: 'PAY_GRADE',
        metric: 'HOURS_WORKED',
        timeWindow: 'PER_MONTH',
        operator: 'MIN',
        threshold: 8,
        hardConstraint: true,
        penalty: 20,
        active: false,
        payGradeId: null,
        shiftTypeId: null,
        teamMemberId: null,
      })

      expect(result).toEqual(
        expect.objectContaining({
          id: rule.id,
          scope: 'PAY_GRADE',
          metric: 'HOURS_WORKED',
          timeWindow: 'PER_MONTH',
          operator: 'MIN',
          threshold: 8,
          hardConstraint: true,
          penalty: 20,
          active: false,
        }),
      )
    })
  })

  describe('delete', () => {
    it('deletes a rule', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const rule = await createRule(team.id)

      const caller = createCaller({
        session: createSessionContext(user),
      })

      await caller.rule.delete({ id: rule.id })

      await expect(
        testDb.rule.findUnique({
          where: { id: rule.id },
        }),
      ).resolves.toBeNull()
    })
  })
})
