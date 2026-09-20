import { faker } from '@faker-js/faker'

import type { ConditionField, ConditionOperator, Prisma } from '@prisma/client'

import { testDb } from '../database'

export async function createRuleCondition(
  ruleId: string,
  overrides: Partial<
    Omit<Prisma.RuleConditionUncheckedCreateInput, 'ruleId'>
  > = {},
) {
  return testDb.ruleCondition.create({
    data: {
      ruleId,
      field: faker.helpers.enumValue({
        MONTH: 'MONTH',
        WEEKDAY: 'WEEKDAY',
        IS_HOLIDAY: 'IS_HOLIDAY',
      }) as ConditionField,
      operator: faker.helpers.enumValue({
        EQ: 'EQ',
        NEQ: 'NEQ',
        IN: 'IN',
        NOT_IN: 'NOT_IN',
        GTE: 'GTE',
        LTE: 'LTE',
      }) as ConditionOperator,
      value: faker.number.int({ min: 1, max: 12 }),
      ...overrides,
    },
  })
}
