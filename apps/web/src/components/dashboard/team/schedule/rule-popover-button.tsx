'use client'

import { useMemo, useState } from 'react'
import {
  PayGradeOutput,
  RuleConditionCreateInput,
  RuleConditionOutput,
  RuleConditionUpdateInput,
  RuleCreateInput,
  RuleOutput,
  RuleUpdateInput,
  ShiftTypeOutput,
  TeamMemberOutput,
} from '@fuku/api/schemas'
import {
  MetricSchema,
  MetricValues,
  RuleConditionField,
  RuleConditionFieldDefaultValues,
  RuleConditionFieldSchema,
  RuleConditionFieldValues,
  RuleConditionOperator,
  RuleConditionOperatorSchema,
  RuleConditionOperatorValues,
  RuleOperatorSchema,
  RuleOperatorValues,
  RuleTargetSchema,
  RuleTargetValues,
  TimeWindowSchema,
  TimeWindowValues,
} from '@fuku/domain/schemas'
import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  ToggleGroup,
  ToggleGroupItem,
} from '@fuku/ui/components'
import { ChevronDown, ChevronDownIcon, ListFilter, X } from 'lucide-react'

import { useDebouncedCommit } from '~/hooks/useDebouncedCommit'
import { useRuleEditor } from '~/hooks/useRuleEditor'
import { MONTH_MAP, WEEKDAY_MAP } from '~/lib/date'
import { MutationMode } from '~/lib/query'

const RULE_CONDITION_FIELD_LABELS: Record<RuleConditionField, string> = {
  [RuleConditionFieldValues.MONTH]: 'Month',
  [RuleConditionFieldValues.WEEKDAY]: 'Weekday',
}

const RULE_CONDITION_OPERATOR_LABELS: Record<RuleConditionOperator, string> = {
  [RuleConditionOperatorValues.EQ]: '=',
  [RuleConditionOperatorValues.NEQ]: '≠',
  [RuleConditionOperatorValues.IN]: '∈',
  [RuleConditionOperatorValues.NOT_IN]: '∉',
  [RuleConditionOperatorValues.GTE]: '≥',
  [RuleConditionOperatorValues.LTE]: '≤',
}

const RULE_CONDITION_VALUE_OPTIONS_BY_FIELD = {
  [RuleConditionFieldValues.MONTH]: MONTH_MAP,
  [RuleConditionFieldValues.WEEKDAY]: WEEKDAY_MAP,
}

type RulePopoverButtonProps = {
  rules: Record<string, RuleOutput>
  ruleConditions: Record<string, RuleConditionOutput[]>
  teamMembers: TeamMemberOutput[]
  shiftTypes: ShiftTypeOutput[]
  payGrades: PayGradeOutput[]
  mutateRule: (
    mode: MutationMode,
    rule: RuleCreateInput | RuleUpdateInput | string,
  ) => Promise<RuleOutput>
  mutateRuleCondition: (
    mode: MutationMode,
    ruleCondition: RuleConditionCreateInput | RuleConditionUpdateInput | string,
  ) => Promise<RuleConditionOutput>
}

export const RulePopoverButton = ({
  rules: initialRules,
  ruleConditions: initialRuleConditions,
  teamMembers,
  shiftTypes,
  payGrades,
  mutateRule,
  mutateRuleCondition,
}: RulePopoverButtonProps) => {
  const {
    rules,
    ruleConditions,
    createRule,
    updateRule,
    deleteRule,
    createRuleCondition,
    updateRuleCondition,
    deleteRuleCondition,
    targetOptions,
  } = useRuleEditor({
    initialRules,
    initialRuleConditions,
    teamMembers,
    shiftTypes,
    payGrades,
    mutateRule,
    mutateRuleCondition,
  })

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant='secondary'>
          <ListFilter />
          {rules ? Object.keys(rules).length : 0} rules
          <ChevronDown />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align='start'
        className='min-w-fit max-h-[40rem] p-0 border border-input shadow-2xl overflow-y-auto'
      >
        <div className='flex flex-col'>
          {rules ? (
            Object.entries(rules).map(([ruleId, rule]) => (
              <RulePanelItem
                key={rule.id}
                rule={rule}
                ruleConditions={
                  ruleConditions ? ruleConditions[rule.id] || [] : []
                }
                targetOptions={targetOptions}
                updateRule={updateRule}
                deleteRule={deleteRule}
                createRuleCondition={createRuleCondition}
                updateRuleCondition={updateRuleCondition}
                deleteRuleCondition={deleteRuleCondition}
              />
            ))
          ) : (
            <div className='p-4 text-sm text-muted-foreground'>
              No rules found.
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

const RulePanelItem = ({
  rule,
  ruleConditions,
  targetOptions,
  updateRule,
  deleteRule,
  createRuleCondition,
  updateRuleCondition,
  deleteRuleCondition,
}: {
  rule: RuleOutput
  ruleConditions: RuleConditionOutput[]
  targetOptions: Record<string, { value: string; label: string }[]>
  updateRule: (rule: RuleUpdateInput) => Promise<void>
  deleteRule: (ruleId: string) => Promise<void>
  createRuleCondition: (condition: RuleConditionCreateInput) => Promise<void>
  updateRuleCondition: (condition: RuleConditionUpdateInput) => Promise<void>
  deleteRuleCondition: (conditionId: string) => Promise<void>
}) => {
  const handleUpdateTargetType = (target: string) => {
    if (target === rule.target) return

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

    updateRule({ ...rule, ...updatedFields })
  }

  const handleUpdateTargetId = (id: string) => {
    if (rule.target === RuleTargetValues.GLOBAL) return
    if (
      rule.target === RuleTargetValues.TEAM_MEMBER &&
      id === rule.teamMemberId
    )
      return
    if (rule.target === RuleTargetValues.PAY_GRADE && id === rule.payGradeId)
      return
    if (rule.target === RuleTargetValues.SHIFT_TYPE && id === rule.shiftTypeId)
      return

    let updatedFields: Partial<RuleUpdateInput> = {}

    switch (rule.target) {
      case RuleTargetValues.TEAM_MEMBER:
        updatedFields = { teamMemberId: id }
        break
      case RuleTargetValues.PAY_GRADE:
        updatedFields = { payGradeId: id }
        break
      case RuleTargetValues.SHIFT_TYPE:
        updatedFields = { shiftTypeId: id }
        break
    }

    updateRule({
      ...rule,
      ...updatedFields,
    } as RuleUpdateInput)
  }

  const handleUpdateMetric = (metric: string) => {
    if (metric === rule.metric) return

    updateRule({
      ...rule,
      metric: MetricSchema.parse(metric),
    } as RuleUpdateInput)
  }

  const handleUpdateOperator = (operator: string) => {
    if (operator === rule.operator) return

    updateRule({
      ...rule,
      operator: RuleOperatorSchema.parse(operator),
    } as RuleUpdateInput)
  }

  const handleUpdateThreshold = (threshold: string) => {
    const thresholdNumber = parseInt(threshold)
    if (isNaN(thresholdNumber)) return
    updateRule({
      ...rule,
      threshold: thresholdNumber,
    } as RuleUpdateInput)
  }

  const handleUpdateTimeWindow = (timeWindow: string) => {
    if (timeWindow === rule.timeWindow) return

    updateRule({
      ...rule,
      timeWindow: TimeWindowSchema.parse(timeWindow),
    } as RuleUpdateInput)
  }

  const handleToggleHardConstraint = (hardConstraint: boolean | string) => {
    if (hardConstraint === rule.hardConstraint) return

    if (typeof hardConstraint === 'string') {
      hardConstraint = hardConstraint === 'true'
    }

    updateRule({
      ...rule,
      hardConstraint,
    } as RuleUpdateInput)
  }

  const handleUpdatePenalty = (penalty: string) => {
    const penaltyNumber = parseInt(penalty)
    if (isNaN(penaltyNumber)) return
    updateRule({
      ...rule,
      penalty: penaltyNumber,
    } as RuleUpdateInput)
  }

  const { schedule: scheduleUpdateThreshold } = useDebouncedCommit(
    handleUpdateThreshold,
  )
  const { schedule: scheduleUpdatePenalty } =
    useDebouncedCommit(handleUpdatePenalty)

  return (
    <Collapsible className='group border-b border-input last:border-0 p-4'>
      <div className='flex flex-col gap-2 items-start *:flex *:flex-row *:gap-2 *:items-center'>
        <div>
          {/* target type*/}
          <Select value={rule.target} onValueChange={handleUpdateTargetType}>
            <SelectTrigger size='chip' variant='secondary'>
              <SelectValue placeholder='Scope' />
            </SelectTrigger>
            <SelectContent>
              {Object.values(RuleTargetValues)
                .filter(
                  value =>
                    targetOptions[value].length > 0 ||
                    value === RuleTargetValues.GLOBAL,
                )
                .map(value => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          {/* target selection, dependent on target */}
          <Select
            disabled={rule.target === RuleTargetValues.GLOBAL}
            value={
              rule.target === RuleTargetValues.GLOBAL
                ? undefined
                : rule.target === RuleTargetValues.TEAM_MEMBER
                  ? (rule.teamMemberId ?? undefined)
                  : rule.target === RuleTargetValues.PAY_GRADE
                    ? (rule.payGradeId ?? undefined)
                    : (rule.shiftTypeId ?? undefined)
            }
            onValueChange={handleUpdateTargetId}
          >
            <SelectTrigger size='chip' variant='secondary'>
              <SelectValue placeholder='Target' />
            </SelectTrigger>
            <SelectContent>
              {targetOptions[rule.target].map(({ value, label }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          {/* metric */}
          <Select value={rule.metric} onValueChange={handleUpdateMetric}>
            <SelectTrigger size='chip' variant='secondary'>
              <SelectValue placeholder='Metric' />
            </SelectTrigger>
            <SelectContent>
              {Object.values(MetricValues).map(value => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* operator */}
          <Select value={rule.operator} onValueChange={handleUpdateOperator}>
            <SelectTrigger size='chip' variant='secondary'>
              <SelectValue placeholder='Operator' />
            </SelectTrigger>
            <SelectContent>
              {Object.values(RuleOperatorValues).map(value => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* threshold */}
          <Input
            className='w-[8ch]'
            type='number'
            placeholder='Value'
            size='chip'
            value={rule.threshold}
            onChange={e => {
              scheduleUpdateThreshold(e.target.value)
            }}
          />
          {/* per */}
          <span className='text-sm'>/</span>
          {/* time window */}
          <Select
            value={rule.timeWindow}
            onValueChange={handleUpdateTimeWindow}
          >
            <SelectTrigger size='chip' variant='secondary'>
              <SelectValue placeholder='Time Window' />
            </SelectTrigger>
            <SelectContent>
              {Object.values(TimeWindowValues).map(value => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          {/* hard constraint y/n */}

          <ToggleGroup
            type='single'
            size='chip'
            variant='outline'
            value={String(rule.hardConstraint)}
            onValueChange={handleToggleHardConstraint}
          >
            <ToggleGroupItem value='true' aria-label='Toggle hard constraint'>
              Required
            </ToggleGroupItem>
            <ToggleGroupItem value='false' aria-label='Toggle soft constraint'>
              Preferred
            </ToggleGroupItem>
          </ToggleGroup>
          {/* penalty */}
          <Input
            className='w-[8ch]'
            size='chip'
            placeholder='Penalty'
            value={rule.penalty ?? undefined}
            onChange={e => {
              scheduleUpdatePenalty(e.target.value)
            }}
            disabled={rule.hardConstraint}
          />
        </div>
        <div>
          <CollapsibleTrigger asChild>
            <Button variant='link' size='chip'>
              {ruleConditions.length} conditions
              <ChevronDown className=' transition-transform duration-300 ease-in-out group-data-[state=open]:rotate-180' />
            </Button>
          </CollapsibleTrigger>
        </div>
      </div>
      <CollapsibleContent className='p-0 pt-2 flex flex-col items-end w-full min-w-0 rounded-b-lg'>
        {ruleConditions.map(rc => (
          <RuleConditionPanelItem
            key={rc.id}
            ruleCondition={rc}
            updateRuleCondition={updateRuleCondition}
            deleteRuleCondition={deleteRuleCondition}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  )
}

const RuleConditionPanelItem = ({
  ruleCondition,
  updateRuleCondition,
  deleteRuleCondition,
}: {
  ruleCondition: RuleConditionOutput
  updateRuleCondition: (condition: RuleConditionUpdateInput) => Promise<void>
  deleteRuleCondition: (conditionId: string) => Promise<void>
}) => {
  const [inputValue, setInputValue] = useState('')

  const isMulti =
    ruleCondition.operator === RuleConditionOperatorValues.IN ||
    ruleCondition.operator === RuleConditionOperatorValues.NOT_IN

  const items = useMemo(() => {
    const source = RULE_CONDITION_VALUE_OPTIONS_BY_FIELD[ruleCondition.field]
    if (!source) return []

    return Object.entries(source).map(([value, label]) => ({
      value: String(value),
      label: String(label),
    }))
  }, [ruleCondition.field])

  /**
   * Convert stored value → UI value
   * Combobox always receives strings
   */
  const uiValue = useMemo(() => {
    const v = ruleCondition.value

    if (isMulti) {
      const arr = Array.isArray(v) ? v : v !== null ? [v] : []
      return arr.map(x => String(x))
    }

    const single = Array.isArray(v) ? v[0] : v
    return single !== undefined && single !== null
      ? String(single)
      : String(RuleConditionFieldDefaultValues[ruleCondition.field])
  }, [ruleCondition.value, ruleCondition.field, isMulti])

  /**
   * Convert UI value → stored value
   */
  const normalizeValue = (
    value: string | number | (string | number)[],
  ): string | number | string[] | number[] => {
    const arr = Array.isArray(value) ? value : [value]

    const parsed =
      ruleCondition.field === RuleConditionFieldValues.MONTH ||
      ruleCondition.field === RuleConditionFieldValues.WEEKDAY
        ? arr.map(v => Number(v))
        : arr.map(v => String(v))

    return isMulti ? parsed : parsed[0]
  }

  const handleUpdateField = (field: string) => {
    if (field === ruleCondition.field) return

    updateRuleCondition({
      ...ruleCondition,
      field: RuleConditionFieldSchema.parse(field),
      value: isMulti ? [] : '',
    })
  }

  const handleUpdateOperator = (operator: string) => {
    if (operator === ruleCondition.operator) return

    const parsedOperator = RuleConditionOperatorSchema.parse(operator)

    const nextIsMulti =
      parsedOperator === RuleConditionOperatorValues.IN ||
      parsedOperator === RuleConditionOperatorValues.NOT_IN

    let value = ruleCondition.value

    if (nextIsMulti && !Array.isArray(value)) {
      if (
        ruleCondition.field === RuleConditionFieldValues.MONTH ||
        ruleCondition.field === RuleConditionFieldValues.WEEKDAY
      ) {
        value =
          value !== undefined && value !== null
            ? [Number(value)]
            : ([] as number[])
      } else {
        value =
          value !== undefined && value !== null
            ? [String(value)]
            : ([] as string[])
      }
    }

    if (!nextIsMulti && Array.isArray(value)) {
      value = value[0] ?? RuleConditionFieldDefaultValues[ruleCondition.field]
    }

    updateRuleCondition({
      ...ruleCondition,
      operator: parsedOperator,
      value,
    })
  }

  const handleUpdateValue = (
    value: string | number | (string | number)[] | null,
  ) => {
    if (value === null) return

    const normalized = normalizeValue(value)

    updateRuleCondition({
      ...ruleCondition,
      value: normalized as RuleConditionUpdateInput['value'],
    })
  }

  return (
    <div className='flex w-full min-w-0 items-center gap-2'>
      {/* field */}
      <Select value={ruleCondition.field} onValueChange={handleUpdateField}>
        <SelectTrigger size='sm'>
          <SelectValue placeholder='Field' />
        </SelectTrigger>

        <SelectContent>
          {Object.values(RuleConditionFieldValues).map(value => (
            <SelectItem key={value} value={value}>
              {RULE_CONDITION_FIELD_LABELS[value]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* operator */}
      <Select
        value={ruleCondition.operator}
        onValueChange={handleUpdateOperator}
      >
        <SelectTrigger size='sm'>
          <SelectValue placeholder='Operator' />
        </SelectTrigger>

        <SelectContent>
          {Object.values(RuleConditionOperatorValues).map(value => (
            <SelectItem key={value} value={value}>
              {RULE_CONDITION_OPERATOR_LABELS[value]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* value */}
      <Combobox
        items={items as { value: string; label: string }[]}
        multiple={isMulti}
        value={uiValue}
        inputValue={inputValue}
        onInputValueChange={setInputValue}
        onValueChange={handleUpdateValue}
      >
        <ComboboxTrigger
          render={
            <Button size='chip' variant='outline' className='min-w-fit'>
              <ComboboxValue placeholder='Value' />
              <ChevronDownIcon className='ml-auto size-4 opacity-50' />
            </Button>
          }
        />

        <ComboboxContent className='min-w-fit'>
          <ComboboxEmpty className='px-6'>No options.</ComboboxEmpty>

          <ComboboxList>
            {(item: { value: string; label: string }) => (
              <ComboboxItem key={item.value} value={item.value}>
                {item.label}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>

      <Button
        variant='ghost'
        size='icon-xs'
        onClick={() => deleteRuleCondition(ruleCondition.id)}
      >
        <X />
      </Button>
    </div>
  )
}
