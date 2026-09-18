import {
  RuleScopeSchema,
  RuleScopeValues,
} from '@fuku/domain/schemas'

import type {
  RULE_GROUP_BY_KEYS,
  RULE_SORT_KEYS,
} from './rule.constants'
import type {
  RuleConditionOutput,
  RuleOutput,
  RuleUpdateInput,
  ShiftTypeOutput,
} from '@fuku/api/schemas'
import type {
  RuleMetric,
  RuleScope,
} from '@fuku/domain/schemas'

import {
  WEEKDAY_CONDITION_ID_PREFIX,
} from './rule.constants'

type ScopeOptions = Record<string, { value: string, label: string }[]>

export function getRuleSearchValue(
  rule: RuleOutput,
  conditions: RuleConditionOutput[],
  scopeOptions: ScopeOptions,
) {
  const scopeLabel
    = rule.scope === 'GLOBAL'
      ? 'global'
      : (scopeOptions[rule.scope].find(
          opt =>
            opt.value
            === (rule.teamMemberId ?? rule.payGradeId ?? rule.shiftTypeId),
        )?.label ?? '')

  return [
    rule.metric,
    rule.timeWindow,
    rule.operator,
    rule.scope,
    scopeLabel,
    rule.hardConstraint ? 'hard required' : 'soft preferred',
  ]
    .join(' ')
    .toLowerCase()
}

export function getShiftTypeWeekdayCondition(
  rule: RuleOutput,
  shiftType: ShiftTypeOutput,
) {
  if (!rule.shiftTypeId)
    return null
  if (!shiftType.allowedWeekdays?.length)
    return null
  return {
    id: WEEKDAY_CONDITION_ID_PREFIX + rule.id,
    ruleId: rule.id,
    field: 'WEEKDAY',
    operator: 'IN',
    value: shiftType.allowedWeekdays,
  } satisfies RuleConditionOutput
}

export function isSyntheticCondition(conditionId: string) {
  return conditionId.startsWith(WEEKDAY_CONDITION_ID_PREFIX)
}

// what changes on the rule when the scope type (scope) changes
export function buildScopeTypeUpdate(
  rule: RuleOutput,
  scope: string,
  scopeOptions: ScopeOptions,
): Partial<RuleUpdateInput> {
  const updatedFields: Partial<RuleUpdateInput> = {
    ...(rule.penalty ? { penalty: rule.penalty } : {}),
    scope: RuleScopeSchema.parse(scope),
    teamMemberId: null,
    payGradeId: null,
    shiftTypeId: null,
  }

  switch (scope) {
    case RuleScopeValues.TEAM_MEMBER:
      updatedFields.teamMemberId
        = scopeOptions[RuleScopeValues.TEAM_MEMBER][0]?.value ?? null
      break
    case RuleScopeValues.PAY_GRADE:
      updatedFields.payGradeId
        = scopeOptions[RuleScopeValues.PAY_GRADE][0]?.value ?? null
      break
    case RuleScopeValues.SHIFT_TYPE:
      updatedFields.shiftTypeId
        = scopeOptions[RuleScopeValues.SHIFT_TYPE][0]?.value ?? null
      break
  }
  return updatedFields
}

// what changes on the rule when the scope id (which member/grade/type) changes
export function buildScopeIdUpdate(
  rule: RuleOutput,
  id: string,
): Partial<RuleUpdateInput> | null {
  switch (rule.scope) {
    case RuleScopeValues.TEAM_MEMBER:
      return id === rule.teamMemberId ? null : { teamMemberId: id }
    case RuleScopeValues.PAY_GRADE:
      return id === rule.payGradeId ? null : { payGradeId: id }
    case RuleScopeValues.SHIFT_TYPE:
      return id === rule.shiftTypeId ? null : { shiftTypeId: id }
    default:
      return null
  }
}

// filtering
export type RuleFilters = {
  scopeList?: RuleScope[]
  activeList?: boolean[]
  metricList?: RuleMetric[]
  hardConstraintList?: boolean[]
}

export function matchesRuleFilters(
  rule: RuleOutput,
  filters?: RuleFilters,
): boolean {
  if (!filters)
    return true

  if (
    filters.scopeList
    && filters.scopeList.length
    && !filters.scopeList.includes(rule.scope)
  ) {
    return false
  }
  if (
    filters.activeList
    && filters.activeList.length
    && !filters.activeList.includes(rule.active)
  ) {
    return false
  }
  if (
    filters.metricList
    && filters.metricList.length
    && !filters.metricList.includes(rule.metric)
  ) {
    return false
  }
  if (
    filters.hardConstraintList
    && filters.hardConstraintList.length
    && !filters.hardConstraintList.includes(rule.hardConstraint)
  ) {
    return false
  }
  return true
}

export function toggleListValue<T>(list: T[] | undefined, value: T): T[] {
  const current = list ?? []
  return current.includes(value)
    ? current.filter(v => v !== value)
    : [...current, value]
}

// --- sorting
export type RuleSortKey = (typeof RULE_SORT_KEYS)[number]

export const RULE_SORT_COMPARATORS: Record<
  RuleSortKey,
  (a: RuleOutput, b: RuleOutput) => number
> = {
  threshold: (a, b) => a.threshold - b.threshold,
  metric: (a, b) => a.metric.localeCompare(b.metric),
  scope: (a, b) => a.scope.localeCompare(b.scope),
  status: (a, b) => Number(b.active) - Number(a.active),
}

export function sortRules(
  rules: RuleOutput[],
  sortBy: RuleSortKey | undefined,
  direction: 'asc' | 'desc' = 'asc',
): RuleOutput[] {
  if (!sortBy)
    return rules
  const sorted = [...rules].sort(RULE_SORT_COMPARATORS[sortBy])
  return direction === 'asc' ? sorted : sorted.reverse()
}

// -- grouping
export type RuleGroupByKey = (typeof RULE_GROUP_BY_KEYS)[number]

export function groupRules(
  rules: RuleOutput[],
  groupBy: RuleGroupByKey | undefined,
): RuleOutput[][] {
  if (!groupBy)
    return [rules]
  const groupKey = groupBy === 'scope' ? 'scope' : 'metric'

  const groups = new Map<string, RuleOutput[]>()

  rules.forEach((rule) => {
    const key = String(rule[groupKey])
    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key)!.push(rule)
  })

  return Array.from(groups.values())
}
