import {
  RuleConditionField,
  RuleConditionFieldValues,
  RuleConditionOperator,
  RuleConditionOperatorValues,
} from '@fuku/domain/schemas'

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
