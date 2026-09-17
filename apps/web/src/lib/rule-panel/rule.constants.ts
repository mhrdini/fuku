import {
  RuleConditionField,
  RuleConditionFieldValues,
  RuleConditionOperator,
  RuleConditionOperatorValues,
  RuleMetric,
  RuleMetricValues,
  RuleScope,
  RuleScopeValues,
} from '@fuku/domain/schemas'
import {
  BadgeDollarSignIcon,
  ClockIcon,
  GlobeIcon,
  LucideIcon,
  UserCircle2Icon,
} from 'lucide-react'

import { MONTH_MAP, WEEKDAY_MAP } from '~/lib/date'

export const RULE_CONDITION_FIELD_LABELS: Record<RuleConditionField, string> = {
  [RuleConditionFieldValues.MONTH]: 'Month',
  [RuleConditionFieldValues.WEEKDAY]: 'Weekday',
  [RuleConditionFieldValues.IS_HOLIDAY]: 'Is Holiday',
}

export const RULE_CONDITION_OPERATOR_LABELS: Record<
  RuleConditionOperator,
  string
> = {
  [RuleConditionOperatorValues.EQ]: '=',
  [RuleConditionOperatorValues.NEQ]: '≠',
  [RuleConditionOperatorValues.IN]: '∈',
  [RuleConditionOperatorValues.NOT_IN]: '∉',
  [RuleConditionOperatorValues.GTE]: '≥',
  [RuleConditionOperatorValues.LTE]: '≤',
}

export const RULE_CONDITION_VALUE_OPTIONS_BY_FIELD = {
  [RuleConditionFieldValues.MONTH]: MONTH_MAP,
  [RuleConditionFieldValues.WEEKDAY]: WEEKDAY_MAP,
  [RuleConditionFieldValues.IS_HOLIDAY]: { true: 'true', false: 'false' },
}

export const WEEKDAY_CONDITION_ID_PREFIX = 'weekday_condition_'

// rule scopes/scopes
export const RULE_SCOPE_LABELS: Record<RuleScope, string> = {
  [RuleScopeValues.PAY_GRADE]: 'Pay Grade',
  [RuleScopeValues.SHIFT_TYPE]: 'Shift Type',
  [RuleScopeValues.TEAM_MEMBER]: 'Team Member',
  [RuleScopeValues.GLOBAL]: 'Global',
}

export const RULE_SCOPE_ICONS: Record<RuleScope, LucideIcon> = {
  [RuleScopeValues.PAY_GRADE]: BadgeDollarSignIcon,
  [RuleScopeValues.SHIFT_TYPE]: ClockIcon,
  [RuleScopeValues.TEAM_MEMBER]: UserCircle2Icon,
  [RuleScopeValues.GLOBAL]: GlobeIcon,
}

// rule metrics
export const RULE_METRIC_LABELS: Record<RuleMetric, string> = {
  [RuleMetricValues.DAYS_WORKED]: 'Days worked',
  [RuleMetricValues.HOURS_WORKED]: 'Hours worked',
  [RuleMetricValues.DAYS_OFF]: 'Days off',
  [RuleMetricValues.CONSECUTIVE_DAYS_WORKED]: 'Consecutive days worked',
  [RuleMetricValues.UNIQUE_MEMBERS_ASSIGNED]: 'Unique members assigned',
}

// rule sorting
export const RULE_SORT_KEYS = [
  'threshold',
  'metric',
  'scope',
  'status',
] as const

// rule grouping
export const RULE_GROUP_BY_KEYS = ['scope', 'metric'] as const
