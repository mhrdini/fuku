import * as z from 'zod/v4'

import { enumToSelfMap } from './enums'
import { JsonValueSchema } from './helpers'

// -------------------------
// Rule Condition Config
// -------------------------

export const RULE_CONDITION_OPTIONS_CONFIG = {
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

// field
export type RuleConditionField = keyof typeof RULE_CONDITION_OPTIONS_CONFIG

type RuleConditionOperatorsByField = {
  [F in RuleConditionField]: (typeof RULE_CONDITION_OPTIONS_CONFIG)[F]['operators'][number]
}

// operator
export type RuleConditionOperator =
  RuleConditionOperatorsByField[keyof RuleConditionOperatorsByField]

export function isMultiOperator(op: RuleConditionOperator) {
  return op === 'IN' || op === 'NOT_IN'
}

export function getRuleConditionOperatorsByField<F extends RuleConditionField>(
  field: F,
) {
  return RULE_CONDITION_OPTIONS_CONFIG[field]['operators']
}

// value
export function getRuleConditionDefaultValueByField<
  F extends RuleConditionField,
>(field: F) {
  return RULE_CONDITION_OPTIONS_CONFIG[field]['defaultValue']
}

export function normalizeConditionValue(
  raw: any,
  field: RuleConditionField,
  operator: RuleConditionOperator,
) {
  const config = RULE_CONDITION_OPTIONS_CONFIG[field]
  const multi = isMultiOperator(operator)

  const arr = Array.isArray(raw) ? raw : raw != null ? [raw] : []

  let parsed

  switch (typeof config.defaultValue) {
    case 'number':
      parsed = arr.map(v => Number(v))
      return multi
        ? (parsed ?? [config.defaultValue])
        : (parsed[0] ?? config.defaultValue)
    case 'boolean':
      parsed = arr.map(v => Boolean(v))
      return parsed[0] ?? config.defaultValue
    default:
      throw new Error(
        `Unsupported condition type: ${typeof config.defaultValue}`,
      )
  }
}

// -------------------------
// Rule Condition Enums
// -------------------------

export const RuleConditionFieldSchema = z.enum(
  Object.keys(RULE_CONDITION_OPTIONS_CONFIG) as [
    RuleConditionField,
    ...RuleConditionField[],
  ],
)

export const RuleConditionFieldValues = enumToSelfMap(RuleConditionFieldSchema)

export const RuleConditionOperatorSchema = z.enum(
  Array.from(
    new Set(
      Object.values(RULE_CONDITION_OPTIONS_CONFIG).flatMap(f => f.operators),
    ),
  ) as [RuleConditionOperator, ...RuleConditionOperator[]],
)

export const RuleConditionOperatorValues = enumToSelfMap(
  RuleConditionOperatorSchema,
)

// -------------------------
// Rule Condition Schemas
// -------------------------

export const MonthCondition = z.object({
  id: z.string(),
  ruleId: z.string(),
  field: z.literal('MONTH'),
  operator: z.enum(RULE_CONDITION_OPTIONS_CONFIG.MONTH.operators),
  value: z.union([z.number(), z.array(z.number())]).nullable(),
})

export const WeekdayCondition = z.object({
  id: z.string(),
  ruleId: z.string(),
  field: z.literal('WEEKDAY'),
  operator: z.enum(RULE_CONDITION_OPTIONS_CONFIG.WEEKDAY.operators),
  value: z.union([z.number(), z.array(z.number())]).nullable(),
})

export const IsHolidayCondition = z.object({
  id: z.string(),
  ruleId: z.string(),
  field: z.literal('IS_HOLIDAY'),
  operator: z.enum(RULE_CONDITION_OPTIONS_CONFIG.IS_HOLIDAY.operators),
  value: z.boolean().nullable().default(true),
})

export const RuleConditionSchema = z.discriminatedUnion('field', [
  MonthCondition,
  WeekdayCondition,
  IsHolidayCondition,
])

export const RuleConditionUndiscriminatedSchema = z.object({
  id: z.string(),
  ruleId: z.string(),
  field: RuleConditionFieldSchema,
  operator: RuleConditionOperatorSchema,
  value: JsonValueSchema.nullable(),
})

export type RuleCondition = z.infer<typeof RuleConditionSchema>
