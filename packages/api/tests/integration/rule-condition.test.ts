import { testDb } from '@fuku/db/testing'
import {
  createRule,
  createRuleCondition,
  createTeam,
  createUser,
} from '@fuku/db/testing/factories'
import { describe, expect, it } from 'vitest'

import { createCaller } from '../helpers/caller'
import { createSessionContext } from '../helpers/context'

describe('rule condition', () => {
  describe('groupByRules', () => {
    it('groups conditions by rule id', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const rule = await createRule(team.id)
      const condition = await createRuleCondition(rule.id)

      const caller = createCaller({
        session: createSessionContext(user),
      })

      const conditions = await caller.ruleCondition.groupByRules({
        teamId: team.id,
      })

      expect(conditions[rule.id]).toEqual([
        expect.objectContaining({
          id: condition.id,
          ruleId: rule.id,
        }),
      ])
    })

    it('returns an empty object when the team has no rules', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)

      const caller = createCaller({
        session: createSessionContext(user),
      })

      await expect(
        caller.ruleCondition.groupByRules({
          teamId: team.id,
        }),
      ).resolves.toEqual({})
    })

    it('excludes conditions belonging to rules from other teams', async () => {
      const user = await createUser()
      const otherUser = await createUser()
      const team = await createTeam(user.id)
      const otherTeam = await createTeam(otherUser.id)

      const otherRule = await createRule(otherTeam.id)
      const otherCondition = await createRuleCondition(otherRule.id)

      const caller = createCaller({
        session: createSessionContext(user),
      })

      const conditions = await caller.ruleCondition.groupByRules({
        teamId: team.id,
      })

      expect(conditions[otherRule.id]).toBeUndefined()
      expect(
        Object.values(conditions).flat(),
      ).not.toContainEqual(
        expect.objectContaining({ id: otherCondition.id }),
      )
    })
  })

  describe('create', () => {
    it('creates a rule condition', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const rule = await createRule(team.id)

      const caller = createCaller({
        session: createSessionContext(user),
      })

      const result = await caller.ruleCondition.create({
        ruleId: rule.id,
        field: 'MONTH',
        operator: 'EQ',
        value: 6,
      })

      expect(result).toEqual({
        id: expect.any(String),
        ruleId: rule.id,
        field: 'MONTH',
        operator: 'EQ',
        value: 6,
      })
    })

    it('creates a condition with a null value', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const rule = await createRule(team.id)

      const caller = createCaller({
        session: createSessionContext(user),
      })

      const result = await caller.ruleCondition.create({
        ruleId: rule.id,
        field: 'MONTH',
        operator: 'EQ',
        value: null,
      })

      expect(result).toEqual({
        id: expect.any(String),
        ruleId: rule.id,
        field: 'MONTH',
        operator: 'EQ',
        value: null,
      })
    })

    it('creates a multi-value condition', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const rule = await createRule(team.id)

      const caller = createCaller({
        session: createSessionContext(user),
      })

      const result = await caller.ruleCondition.create({
        ruleId: rule.id,
        field: 'MONTH',
        operator: 'IN',
        value: [1, 6, 12],
      })

      expect(result).toEqual({
        id: expect.any(String),
        ruleId: rule.id,
        field: 'MONTH',
        operator: 'IN',
        value: [1, 6, 12],
      })
    })
  })

  describe('update', () => {
    it('updates a rule condition', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const rule = await createRule(team.id)
      const condition = await createRuleCondition(rule.id)

      const caller = createCaller({
        session: createSessionContext(user),
      })

      const result = await caller.ruleCondition.update({
        id: condition.id,
        ruleId: rule.id,
        field: 'WEEKDAY',
        operator: 'IN',
        value: [1, 5],
      })

      expect(result).toEqual(
        expect.objectContaining({
          id: condition.id,
          ruleId: rule.id,
          field: 'WEEKDAY',
          operator: 'IN',
          value: [1, 5],
        }),
      )
    })

    it('updates a condition value to null', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const rule = await createRule(team.id)
      const condition = await createRuleCondition(rule.id)

      const caller = createCaller({
        session: createSessionContext(user),
      })

      const result = await caller.ruleCondition.update({
        id: condition.id,
        ruleId: rule.id,
        value: null,
      })

      expect(result).toEqual(
        expect.objectContaining({
          id: condition.id,
          value: null,
        }),
      )
    })
  })

  describe('delete', () => {
    it('deletes a rule condition', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const rule = await createRule(team.id)
      const condition = await createRuleCondition(rule.id)

      const caller = createCaller({
        session: createSessionContext(user),
      })

      const result = await caller.ruleCondition.delete({
        id: condition.id,
      })

      expect(result).toEqual(
        expect.objectContaining({
          id: condition.id,
          ruleId: rule.id,
        }),
      )

      await expect(
        testDb.ruleCondition.findUnique({
          where: { id: condition.id },
        }),
      ).resolves.toBeNull()
    })
  })
})
