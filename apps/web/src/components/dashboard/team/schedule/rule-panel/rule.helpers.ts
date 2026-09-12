import {
  RuleConditionOutput,
  RuleOutput,
  RuleUpdateInput,
  ShiftTypeOutput,
} from '@fuku/api/schemas'
import { RuleTargetSchema, RuleTargetValues } from '@fuku/domain/schemas'

import { WEEKDAY_CONDITION_ID_PREFIX } from './rule.constants'

type TargetOptions = Record<string, { value: string; label: string }[]>

export function getRuleSearchValue(
  rule: RuleOutput,
  conditions: RuleConditionOutput[],
  targetOptions: TargetOptions,
) {
  const targetLabel =
    rule.target === 'GLOBAL'
      ? 'global'
      : (targetOptions[rule.target].find(
          opt =>
            opt.value ===
            (rule.teamMemberId ?? rule.payGradeId ?? rule.shiftTypeId),
        )?.label ?? '')

  return [
    rule.metric,
    rule.timeWindow,
    rule.operator,
    rule.target,
    targetLabel,
    rule.hardConstraint ? 'hard required' : 'soft preferred',
  ]
    .join(' ')
    .toLowerCase()
}

export function getShiftTypeWeekdayCondition(
  rule: RuleOutput,
  shiftType: ShiftTypeOutput,
) {
  if (!rule.shiftTypeId) return null
  if (!shiftType.allowedWeekdays?.length) return null
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

// what changes on the rule when the target type (scope) changes
export function buildTargetTypeUpdate(
  rule: RuleOutput,
  target: string,
  targetOptions: TargetOptions,
): Partial<RuleUpdateInput> {
  const updatedFields: Partial<RuleUpdateInput> = {
    ...(rule.penalty ? { penalty: rule.penalty } : {}),
    target: RuleTargetSchema.parse(target),
    teamMemberId: null,
    payGradeId: null,
    shiftTypeId: null,
  }

  switch (target) {
    case RuleTargetValues.TEAM_MEMBER:
      updatedFields.teamMemberId =
        targetOptions[RuleTargetValues.TEAM_MEMBER][0]?.value ?? null
      break
    case RuleTargetValues.PAY_GRADE:
      updatedFields.payGradeId =
        targetOptions[RuleTargetValues.PAY_GRADE][0]?.value ?? null
      break
    case RuleTargetValues.SHIFT_TYPE:
      updatedFields.shiftTypeId =
        targetOptions[RuleTargetValues.SHIFT_TYPE][0]?.value ?? null
      break
  }
  return updatedFields
}

/** what changes on the rule when the target id (which member/grade/type) changes */
export function buildTargetIdUpdate(
  rule: RuleOutput,
  id: string,
): Partial<RuleUpdateInput> | null {
  switch (rule.target) {
    case RuleTargetValues.TEAM_MEMBER:
      return id === rule.teamMemberId ? null : { teamMemberId: id }
    case RuleTargetValues.PAY_GRADE:
      return id === rule.payGradeId ? null : { payGradeId: id }
    case RuleTargetValues.SHIFT_TYPE:
      return id === rule.shiftTypeId ? null : { shiftTypeId: id }
    default:
      return null
  }
}
