'use client'

import { useCallback, useMemo, useState } from 'react'

import {
  getRuleConditionDefaultValueByField,
  normalizeConditionValue,
  RULE_CONDITION_OPTIONS_CONFIG,
  RuleConditionFieldSchema,
  RuleConditionFieldValues,
  RuleConditionOperatorSchema,
  RuleConditionOperatorValues,
} from '@fuku/domain/schemas'
import { useTranslation } from '@fuku/i18n/react'
import {
  Button,
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@fuku/ui/components'
import { cn } from '@fuku/ui/lib/utils'
import { ChevronDownIcon, XIcon } from 'lucide-react'

import type {
  RuleConditionOutput,
  RuleConditionUpdateInput,
} from '@fuku/api/schemas'

import {
  RULE_CONDITION_FIELD_LABELS,
  RULE_CONDITION_OPERATOR_LABELS,
  RULE_CONDITION_VALUE_OPTIONS_BY_FIELD,
} from '~/lib/rule-panel/rule.constants'
import { isSyntheticCondition } from '~/lib/rule-panel/rule.helpers'

function RuleConditionPanelItem({
  ruleCondition,
  updateRuleCondition,
  deleteRuleCondition,
}: {
  ruleCondition: RuleConditionOutput
  updateRuleCondition: (
    condition: RuleConditionUpdateInput,
  ) => Promise<RuleConditionOutput>
  deleteRuleCondition: (conditionId: string) => Promise<RuleConditionOutput>
}) {
  const { t } = useTranslation()
  const [inputValue, setInputValue] = useState('')

  const isMulti
    = ruleCondition.operator === RuleConditionOperatorValues.IN
      || ruleCondition.operator === RuleConditionOperatorValues.NOT_IN

  const items = useMemo(() => {
    const source: Map<string, string> | undefined
      = RULE_CONDITION_VALUE_OPTIONS_BY_FIELD[ruleCondition.field]
    if (!source)
      return []

    return Array.from(source).map(([value, label]) => ({
      value: String(value),
      label: String(label),
    }))
  }, [ruleCondition.field])

  /**
   * Convert stored value → UI value
   * Combobox always receives strings
   */
  const getLocalisedValue = useCallback((uiValue: string) => {
    return t(
      RULE_CONDITION_VALUE_OPTIONS_BY_FIELD[ruleCondition.field].get(uiValue)!,
    )
  }, [])

  const uiValue = useMemo(() => {
    const v = ruleCondition.value

    if (isMulti) {
      const arr = Array.isArray(v) ? v : v !== null ? [v] : []
      return arr.map(x => getLocalisedValue(String(x)))
    }

    const single = Array.isArray(v) ? v[0] : v
    return single !== undefined && single !== null
      ? getLocalisedValue(String(single))
      : getLocalisedValue(
          String(
            RULE_CONDITION_OPTIONS_CONFIG[ruleCondition.field].defaultValue,
          ),
        )
  }, [ruleCondition.value, ruleCondition.field, isMulti])

  const handleUpdateField = (field: string) => {
    if (field === ruleCondition.field)
      return

    const nextField = RuleConditionFieldSchema.parse(field)
    const config = RULE_CONDITION_OPTIONS_CONFIG[nextField]

    // pick first valid operator
    const nextOperator = config.operators[0]

    const nextValue = normalizeConditionValue(
      config.defaultValue,
      nextField,
      nextOperator,
    )

    const update = {
      id: ruleCondition.id,
      ruleId: ruleCondition.ruleId,
      field: nextField,
      operator: nextOperator,
      value: nextValue,
    }

    updateRuleCondition(update)
  }

  const handleUpdateOperator = (operator: string) => {
    if (operator === ruleCondition.operator)
      return

    const parsedOperator = RuleConditionOperatorSchema.parse(operator)

    const nextIsMulti
      = parsedOperator === RuleConditionOperatorValues.IN
        || parsedOperator === RuleConditionOperatorValues.NOT_IN

    let value = ruleCondition.value

    if (nextIsMulti && !Array.isArray(value)) {
      switch (ruleCondition.field) {
        case RuleConditionFieldValues.MONTH:
        case RuleConditionFieldValues.WEEKDAY:
          value = [Number(value || items[0].value)]
          break
      }
    }

    if (!nextIsMulti && Array.isArray(value)) {
      value
        = value[0] ?? getRuleConditionDefaultValueByField(ruleCondition.field)
    }

    updateRuleCondition({
      ...ruleCondition,
      operator: parsedOperator,
      value,
    })
  }

  const handleUpdateValue = (value: string | string[] | null) => {
    const updatedValue = value
      ? normalizeConditionValue(
          value,
          ruleCondition.field,
          ruleCondition.operator,
        )
      : null
    updateRuleCondition({
      ...ruleCondition,
      value: updatedValue,
    })
  }

  const isWeekdayCondition = useMemo(
    () => isSyntheticCondition(ruleCondition.id),
    [ruleCondition.id],
  )

  return (
    <div className='group/condition flex w-full min-w-0 items-center gap-1'>
      {/* field */}
      <Select
        disabled={isWeekdayCondition}
        value={ruleCondition.field}
        onValueChange={handleUpdateField}
      >
        <SelectTrigger size='sm' className='grow'>
          <SelectValue placeholder={t('field')} />
        </SelectTrigger>

        <SelectContent>
          {Object.values(RuleConditionFieldValues).map(value => (
            <SelectItem key={value} value={value}>
              {t(value, RULE_CONDITION_FIELD_LABELS)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {/* operator */}
      <Select
        disabled={isWeekdayCondition}
        value={ruleCondition.operator}
        onValueChange={handleUpdateOperator}
      >
        <SelectTrigger size='sm'>
          <SelectValue placeholder={t('operator')} />
        </SelectTrigger>

        <SelectContent>
          {RULE_CONDITION_OPTIONS_CONFIG[ruleCondition.field].operators.map(
            value => (
              <SelectItem key={value} value={value}>
                {RULE_CONDITION_OPERATOR_LABELS[value]}
              </SelectItem>
            ),
          )}
        </SelectContent>
      </Select>
      {/* value */}
      <Combobox
        disabled={isWeekdayCondition}
        items={items as { value: string, label: string }[]}
        multiple={isMulti}
        value={uiValue}
        inputValue={inputValue}
        onInputValueChange={setInputValue}
        onValueChange={handleUpdateValue}
      >
        <ComboboxTrigger
          render={(
            <Button size='sm' variant='outline' className='min-w-fit grow'>
              <span>
                {Array.isArray(uiValue) ? uiValue.join(', ') : uiValue || '-'}
              </span>
              <ChevronDownIcon className='ml-auto size-4 opacity-50' />
            </Button>
          )}
        />

        <ComboboxContent className='min-w-fit'>
          <ComboboxEmpty className='px-6'>
            {t('noOptions', 'No options.')}
          </ComboboxEmpty>

          <ComboboxList>
            {(item: { value: string, label: string }) => (
              <ComboboxItem key={item.value} value={item.value}>
                {t(item.label)}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      <Button
        variant='ghost'
        size='icon-sm'
        onClick={() => deleteRuleCondition(ruleCondition.id)}
        className={cn(
          'opacity-20 transition-opacity duration-75 ease-in-out group-hover/condition:opacity-100',
          isWeekdayCondition && 'hidden',
        )}
      >
        <XIcon />
      </Button>
    </div>
  )
}

export default RuleConditionPanelItem
