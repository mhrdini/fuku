import { faker } from '@faker-js/faker'

import type { Metric, Prisma, RuleOperator, RuleScope, TimeWindow } from '@prisma/client'

import { testDb } from '../database'

export async function createRule(
  teamId: string,
  overrides: Partial<
    Omit<Prisma.RuleUncheckedCreateInput, 'teamId'>
  > = {},
) {
  return testDb.rule.create({
    data: {
      teamId,
      scope: faker.helpers.enumValue({
        GLOBAL: 'GLOBAL',
        PAY_GRADE: 'PAY_GRADE',
        SHIFT_TYPE: 'SHIFT_TYPE',
        TEAM_MEMBER: 'TEAM_MEMBER',
      }) as RuleScope,
      metric: faker.helpers.enumValue({
        DAYS_WORKED: 'DAYS_WORKED',
        HOURS_WORKED: 'HOURS_WORKED',
        DAYS_OFF: 'DAYS_OFF',
        CONSECUTIVE_DAYS_WORKED: 'CONSECUTIVE_DAYS_WORKED',
        UNIQUE_MEMBERS_ASSIGNED: 'UNIQUE_MEMBERS_ASSIGNED',
      }) as Metric,
      timeWindow: faker.helpers.enumValue({
        PER_DAY: 'PER_DAY',
        PER_WEEK: 'PER_WEEK',
        PER_MONTH: 'PER_MONTH',
        PER_ROLLING_WEEK: 'PER_ROLLING_WEEK',
        PER_ROLLING_MONTH: 'PER_ROLLING_MONTH',
      }) as TimeWindow,
      operator: faker.helpers.enumValue({
        MIN: 'MIN',
        MAX: 'MAX',
      }) as RuleOperator,
      threshold: faker.number.int({ min: 1, max: 10 }),
      hardConstraint: false,
      penalty: faker.number.int({ min: 1, max: 10 }),
      active: true,
      ...overrides,
    },
  })
}
