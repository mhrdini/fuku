import { faker } from '@faker-js/faker'

import type {
  ConditionField,
  Prisma,
} from '../../generated/prisma/client'

import { testDb } from '../database'

// TODO: this is still directly copied from domain schema for rule condition
const RULE_CONDITION_OPTIONS_CONFIG = {
  MONTH: {
    operators: ['EQ', 'NEQ', 'IN', 'NOT_IN', 'GTE', 'LTE'],
    defaultValue: 1,
  },
  WEEKDAY: {
    operators: ['EQ', 'NEQ', 'IN', 'NOT_IN', 'GTE', 'LTE'],
    defaultValue: 1,
  },
  IS_HOLIDAY: {
    operators: ['EQ', 'NEQ'],
    defaultValue: true,
  },
} as const

export async function createRuleCondition(
  ruleId: string,
  overrides: Partial<
    Omit<Prisma.RuleConditionUncheckedCreateInput, 'ruleId'>
  > = {},
) {
  const field = faker.helpers.enumValue({
    MONTH: 'MONTH',
    WEEKDAY: 'WEEKDAY',
    IS_HOLIDAY: 'IS_HOLIDAY',
  }) as ConditionField

  const operator = faker.helpers.arrayElement(
    RULE_CONDITION_OPTIONS_CONFIG[field].operators,
  )

  const value = field === 'IS_HOLIDAY'
    ? faker.datatype.boolean()
    : faker.number.int({ min: 1, max: field === 'MONTH' ? 12 : 7 })

  return testDb.ruleCondition.create({
    data: {
      ruleId,
      field,
      operator,
      value,
      ...overrides,
    },
  })
}
