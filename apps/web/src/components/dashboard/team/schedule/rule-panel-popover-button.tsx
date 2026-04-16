'use client'

import { useEffect, useMemo, useState } from 'react'
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
  TeamOutput,
} from '@fuku/api/schemas'
import {
  getRuleConditionDefaultValueByField,
  normalizeConditionValue,
  RULE_CONDITION_OPTIONS_CONFIG,
  RuleConditionField,
  RuleConditionFieldSchema,
  RuleConditionFieldValues,
  RuleConditionOperator,
  RuleConditionOperatorSchema,
  RuleConditionOperatorValues,
  RuleMetricSchema,
  RuleMetricValues,
  RuleOperatorSchema,
  RuleOperatorValues,
  RuleTargetSchema,
  RuleTargetValues,
  RuleTimeWindowSchema,
  RuleTimeWindowValues,
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
  Command,
  CommandInput,
  CommandItem,
  CommandSeparator,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
import { cn } from '@fuku/ui/lib/utils'
import {
  ChevronDown,
  ChevronDownIcon,
  ChevronRight,
  Copy,
  Ellipsis,
  ListFilter,
  Plus,
  Trash,
  X,
} from 'lucide-react'

import { useRuleEditor } from '~/hooks/useRuleEditor'
import { MONTH_MAP, WEEKDAY_MAP } from '~/lib/date'
import { MutationMode } from '~/lib/query'

const RULE_CONDITION_FIELD_LABELS: Record<RuleConditionField, string> = {
  [RuleConditionFieldValues.MONTH]: 'Month',
  [RuleConditionFieldValues.WEEKDAY]: 'Weekday',
  [RuleConditionFieldValues.IS_HOLIDAY]: 'Is Holiday',
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
  [RuleConditionFieldValues.IS_HOLIDAY]: { true: 'true', false: 'false' },
}

const WEEKDAY_CONDITION_ID_PREFIX = 'weekday_condition_'

function getRuleSearchValue(
  rule: RuleOutput,
  conditions: RuleConditionOutput[],
  targetOptions: Record<string, { value: string; label: string }[]>,
) {
  const targetLabel =
    rule.target === 'GLOBAL'
      ? 'global'
      : (targetOptions[rule.target].find(
          opt =>
            opt.value ===
            (rule.teamMemberId ?? rule.payGradeId ?? rule.shiftTypeId),
        )?.label ?? '')

  // const conditionText = conditions
  //   .map(c => `${c.field} ${c.operator} ${JSON.stringify(c.value)}`)
  //   .join(' ')

  return [
    rule.metric,
    rule.timeWindow,
    rule.operator,
    rule.target,
    targetLabel,
    rule.hardConstraint ? 'hard required' : 'soft preferred',
    // rule.threshold,
    // conditionText,
  ]
    .join(' ')
    .toLowerCase()
}

function getShiftTypeWeekdayCondition(
  rule: RuleOutput,
  shiftType: ShiftTypeOutput,
) {
  if (!rule.shiftTypeId) return null
  if (!shiftType.allowedWeekdays || shiftType.allowedWeekdays.length === 0)
    return null
  const weekdayCondition: RuleConditionOutput = {
    id: WEEKDAY_CONDITION_ID_PREFIX + rule.id,
    ruleId: rule.id,
    field: 'WEEKDAY',
    operator: 'IN',
    value: shiftType.allowedWeekdays,
  }
  return weekdayCondition
}

type RulePanelPopoverButtonProps = {
  team: TeamOutput
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

export const RulePanelPopoverButton = ({
  team,
  rules: initialRules,
  ruleConditions: initialRuleConditions,
  teamMembers,
  shiftTypes,
  payGrades,
  mutateRule,
  mutateRuleCondition,
}: RulePanelPopoverButtonProps) => {
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

  const weekdayConditionsMap = useMemo(() => {
    const map = new Map<string, RuleConditionOutput>()
    for (const rule of Object.values(rules)) {
      if (!rule.shiftTypeId) continue
      const shiftType = shiftTypes.find(st => st.id === rule.shiftTypeId)
      if (!shiftType) continue
      const weekdayCondition: RuleConditionOutput | null =
        getShiftTypeWeekdayCondition(rule, shiftType)
      if (!weekdayCondition) continue
      map.set(rule.id, weekdayCondition)
    }
    return map
  }, [shiftTypes, rules])

  const handleCreateRule = () => {
    if (team.id === undefined) return
    createRule({
      teamId: team.id,
      target: RuleTargetValues.GLOBAL,
      payGradeId: null,
      shiftTypeId: null,
      teamMemberId: null,
      metric: RuleMetricValues.DAYS_WORKED,
      operator: RuleOperatorValues.MIN,
      threshold: 1,
      timeWindow: RuleTimeWindowValues.WEEK,
      hardConstraint: true,
    })
  }

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
        className='min-w-fit min-h-0 flex flex-col max-h-[40rem] p-0 border border-border shadow-2xl '
      >
        <Command>
          <div className='p-2 flex gap-2 w-full'>
            <CommandInput className='w-full' placeholder='Search rules...' />
          </div>
          <CommandSeparator />
          <div className='group/rules flex flex-col min-w-fit overflow-y-auto'>
            {rules && Object.keys(rules).length ? (
              Object.entries(rules).map(([ruleId, rule]) => (
                <div key={ruleId}>
                  <CommandItem
                    value={getRuleSearchValue(
                      rule,
                      ruleConditions ? ruleConditions[rule.id] || [] : [],
                      targetOptions,
                    )}
                    asChild
                  >
                    <RulePanelItem
                      rule={rule}
                      ruleConditions={
                        ruleConditions
                          ? weekdayConditionsMap
                            ? [
                                ...(weekdayConditionsMap.get(rule.id)
                                  ? [weekdayConditionsMap.get(rule.id)!]
                                  : []),
                                ...(ruleConditions[rule.id] || []),
                              ]
                            : ruleConditions[rule.id] || []
                          : []
                      }
                      targetOptions={targetOptions}
                      createRule={createRule}
                      updateRule={updateRule}
                      deleteRule={deleteRule}
                      createRuleCondition={createRuleCondition}
                      updateRuleCondition={updateRuleCondition}
                      deleteRuleCondition={deleteRuleCondition}
                    />
                  </CommandItem>
                  <CommandSeparator />
                </div>
              ))
            ) : (
              <div className='text-sm text-muted-foreground p-4'>
                No rules found.
              </div>
            )}
          </div>
          <CommandSeparator />
          <div className='p-2 w-full flex'>
            <Button
              className='w-full'
              variant='secondary'
              onClick={handleCreateRule}
            >
              <Plus />
              Add rule
            </Button>
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

const RulePanelItem = ({
  rule,
  ruleConditions,
  targetOptions,
  createRule,
  updateRule,
  deleteRule,
  createRuleCondition,
  updateRuleCondition,
  deleteRuleCondition,
}: {
  rule: RuleOutput
  ruleConditions: RuleConditionOutput[]
  targetOptions: Record<string, { value: string; label: string }[]>
  createRule: (rule: RuleCreateInput) => Promise<RuleOutput>
  updateRule: (rule: RuleUpdateInput) => Promise<RuleOutput>
  deleteRule: (ruleId: string) => Promise<RuleOutput>
  createRuleCondition: (
    condition: RuleConditionCreateInput,
  ) => Promise<RuleConditionOutput>
  updateRuleCondition: (
    condition: RuleConditionUpdateInput,
  ) => Promise<RuleConditionOutput>
  deleteRuleCondition: (conditionId: string) => Promise<RuleConditionOutput>
}) => {
  // local state
  const [thresholdInput, setThresholdInput] = useState(String(rule.threshold))

  const [penaltyInput, setPenaltyInput] = useState(
    rule.penalty !== null && rule.penalty !== undefined
      ? String(rule.penalty)
      : '',
  )

  useEffect(() => {
    setThresholdInput(String(rule.threshold))
  }, [rule.threshold])

  useEffect(() => {
    setPenaltyInput(
      rule.penalty !== null && rule.penalty !== undefined
        ? String(rule.penalty)
        : '',
    )
  }, [rule.penalty])

  // update
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

  const handleUpdateRuleMetric = (metric: string) => {
    if (metric === rule.metric) return

    updateRule({
      ...rule,
      metric: RuleMetricSchema.parse(metric),
    } as RuleUpdateInput)
  }

  const handleUpdateOperator = (operator: string) => {
    if (operator === rule.operator) return

    updateRule({
      ...rule,
      operator: RuleOperatorSchema.parse(operator),
    } as RuleUpdateInput)
  }

  const commitThreshold = () => {
    if (thresholdInput.trim() === '') return

    const num = Number(thresholdInput)
    if (Number.isNaN(num)) return
    if (num === rule.threshold) return
    if (num < 0) return

    updateRule({
      ...rule,
      threshold: num,
    } as RuleUpdateInput)
  }
  const handleUpdateRuleTimeWindow = (timeWindow: string) => {
    if (timeWindow === rule.timeWindow) return

    updateRule({
      ...rule,
      timeWindow: RuleTimeWindowSchema.parse(timeWindow),
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

  const commitPenalty = () => {
    if (penaltyInput.trim() === '') {
      updateRule({
        ...rule,
        penalty: null,
      } as RuleUpdateInput)
      return
    }

    const num = Number(penaltyInput)
    if (Number.isNaN(num)) return
    if (num === rule.penalty) return
    if (num < 0) return

    updateRule({
      ...rule,
      penalty: num,
    } as RuleUpdateInput)
  }

  // delete
  const handleDeleteRule = () => {
    deleteRule(rule.id)
  }

  // duplicate
  const handleDuplicateRule = () => {
    const { id, ...rest } = rule
    const newRule = {
      ...rest,
      ruleConditions: ruleConditions.map(
        ({ id, ruleId, ...condition }) => condition,
      ),
    }
    createRule(newRule as RuleCreateInput)
  }

  // create condition
  const handleCreateCondition = () => {
    createRuleCondition({
      ruleId: rule.id,
      field: RuleConditionFieldValues.MONTH,
      operator: RuleConditionOperatorValues.EQ,
      value: getRuleConditionDefaultValueByField(
        RuleConditionFieldValues.MONTH,
      ) as typeof RULE_CONDITION_OPTIONS_CONFIG.MONTH.defaultValue,
    })
  }

  return (
    <Collapsible id={`rule-${rule.id}`} className='group p-4'>
      <div className='flex flex-col gap-2 items-start *:flex *:flex-row *:gap-2 *:items-center *:justify-start *:w-full'>
        {/* first row */}
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
          {/* actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' size='icon-chip' className='ml-auto'>
                <Ellipsis />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side='bottom' align='start'>
              <DropdownMenuItem
                variant='destructive'
                onClick={handleDeleteRule}
              >
                <Trash />
                Remove
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDuplicateRule}>
                <Copy />
                Duplicate
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {/* second row */}
        <div>
          {/* metric */}
          <Select value={rule.metric} onValueChange={handleUpdateRuleMetric}>
            <SelectTrigger size='chip' variant='secondary'>
              <SelectValue placeholder='RuleMetric' />
            </SelectTrigger>
            <SelectContent>
              {Object.values(RuleMetricValues).map(value => (
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
            value={thresholdInput}
            onChange={e => setThresholdInput(e.target.value)}
            onBlur={commitThreshold}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === 'Escape') {
                commitThreshold()
              }
            }}
          />
          {/* per */}
          <span className='text-sm'>/</span>
          {/* time window */}
          <Select
            value={rule.timeWindow}
            onValueChange={handleUpdateRuleTimeWindow}
          >
            <SelectTrigger size='chip' variant='secondary'>
              <SelectValue placeholder='Time Window' />
            </SelectTrigger>
            <SelectContent>
              {Object.values(RuleTimeWindowValues).map(value => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* third row */}
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
            value={penaltyInput}
            onChange={e => setPenaltyInput(e.target.value)}
            onBlur={commitPenalty}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === 'Escape') {
                e.stopPropagation()
                commitPenalty()
              }
            }}
            disabled={rule.hardConstraint}
          />
        </div>
        <div>
          <CollapsibleTrigger asChild>
            <Button variant='link' size='chip'>
              <ChevronRight className=' transition-transform duration-300 ease-in-out group-data-[state=open]:rotate-90' />
              {ruleConditions.length} conditions
            </Button>
          </CollapsibleTrigger>
        </div>
      </div>
      <CollapsibleContent className='p-0 pt-2 flex flex-col w-full min-w-0 rounded-b-lg gap-2 pl-6'>
        {ruleConditions.map(rc => {
          return (
            <RuleConditionPanelItem
              key={rc.id}
              ruleCondition={rc}
              updateRuleCondition={updateRuleCondition}
              deleteRuleCondition={deleteRuleCondition}
            />
          )
        })}
        <Button
          size='sm'
          variant='ghost'
          className='justify-start'
          onClick={handleCreateCondition}
        >
          <Plus />
          Add condition
        </Button>
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
  updateRuleCondition: (
    condition: RuleConditionUpdateInput,
  ) => Promise<RuleConditionOutput>
  deleteRuleCondition: (conditionId: string) => Promise<RuleConditionOutput>
}) => {
  const [inputValue, setInputValue] = useState('')

  const isMulti =
    ruleCondition.operator === RuleConditionOperatorValues.IN ||
    ruleCondition.operator === RuleConditionOperatorValues.NOT_IN

  const items = useMemo(() => {
    const source: Record<string, string> | undefined =
      RULE_CONDITION_VALUE_OPTIONS_BY_FIELD[ruleCondition.field]
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
      : String(RULE_CONDITION_OPTIONS_CONFIG[ruleCondition.field].defaultValue)
  }, [ruleCondition.value, ruleCondition.field, isMulti])

  const handleUpdateField = (field: string) => {
    if (field === ruleCondition.field) return

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
    if (operator === ruleCondition.operator) return

    const parsedOperator = RuleConditionOperatorSchema.parse(operator)

    const nextIsMulti =
      parsedOperator === RuleConditionOperatorValues.IN ||
      parsedOperator === RuleConditionOperatorValues.NOT_IN

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
      value =
        value[0] ?? getRuleConditionDefaultValueByField(ruleCondition.field)
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
    () => ruleCondition.id.startsWith(WEEKDAY_CONDITION_ID_PREFIX),
    [ruleCondition.id],
  )

  return (
    <div className='group/condition flex w-full min-w-0 items-center gap-2'>
      {/* field */}
      <Select
        disabled={isWeekdayCondition}
        value={ruleCondition.field}
        onValueChange={handleUpdateField}
      >
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
        disabled={isWeekdayCondition}
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
        disabled={isWeekdayCondition}
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
              <ComboboxValue placeholder='-' />
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
        className={cn(
          'opacity-20 group-hover/condition:opacity-100 transition-opacity duration-75 ease-in-out',
          isWeekdayCondition && 'hidden',
        )}
      >
        <X />
      </Button>
    </div>
  )
}
