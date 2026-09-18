'use client'

import { useMemo } from 'react'

import {
  RuleMetricValues,
  RuleOperatorValues,
  RuleScopeValues,
  RuleTimeWindowValues,
} from '@fuku/domain/schemas'
import i18next from '@fuku/i18n/client'
import { useTranslation } from '@fuku/i18n/react'
import {
  Button,
  Command,
  CommandInput,
  CommandItem,
  CommandSeparator,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ScrollArea,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@fuku/ui/components'
import { cn } from '@fuku/ui/lib/utils'
import {
  ArrowDownNarrowWideIcon,
  ArrowUpWideNarrowIcon,
  ChevronDown,
  CircleDashedIcon,
  CircleIcon,
  GaugeIcon,
  ListFilterIcon,
  LoaderIcon,
  Plus,
  Settings2Icon,
  UserRoundCheckIcon,
  WorkflowIcon,
} from 'lucide-react'

import type {
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

import { useRuleEditor } from '~/hooks/rule-panel/use-rule-editor'
import { useRuleFilters } from '~/hooks/rule-panel/use-rule-filters'
import { useRuleGroupBySort } from '~/hooks/rule-panel/use-rule-group-by-sort'
import { preventCloseOnSelect } from '~/lib/event'
import type { MutationMode } from '~/lib/query'
import {
  RULE_GROUP_BY_KEYS,
  RULE_METRIC_LABELS,
  RULE_SCOPE_ICONS,
  RULE_SCOPE_LABELS,
  RULE_SORT_KEYS,
  WEEKDAY_CONDITION_ID_PREFIX,
} from '~/lib/rule-panel/rule.constants'
import type { RuleGroupByKey, RuleSortKey } from '~/lib/rule-panel/rule.helpers'

import RulePanelItem from './rule-panel-item'

function getRuleSearchValue(
  rule: RuleOutput,
  conditions: RuleConditionOutput[],
  scopeOptions: Record<string, { value: string, label: string }[]>,
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
    i18next.t(rule.metric),
    i18next.t(rule.timeWindow),
    i18next.t(rule.operator),
    i18next.t(rule.scope),
    scopeLabel,
    rule.hardConstraint ? i18next.t('required') : i18next.t('preferred'),
  ]
    .join(' ')
    .toLowerCase()
}

function getShiftTypeWeekdayCondition(
  rule: RuleOutput,
  shiftType: ShiftTypeOutput,
) {
  if (!rule.shiftTypeId)
    return null
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

export function RulePanelPopoverButton({
  team,
  rules: initialRules,
  ruleConditions: initialRuleConditions,
  teamMembers,
  shiftTypes,
  payGrades,
  mutateRule,
  mutateRuleCondition,
}: RulePanelPopoverButtonProps) {
  const { t } = useTranslation()
  const {
    rules,
    ruleConditions,
    createRule,
    updateRule,
    deleteRule,
    createRuleCondition,
    updateRuleCondition,
    deleteRuleCondition,
    scopeOptions,
  } = useRuleEditor({
    initialRules,
    initialRuleConditions,
    teamMembers,
    shiftTypes,
    payGrades,
    mutateRule,
    mutateRuleCondition,
  })

  const allRules = useMemo(() => Object.values(rules), [rules])
  const {
    filteredRules,
    filters,
    toggleActive,
    toggleScope,
    toggleMetric,
    hasActiveFilters,
    clearFilters,
  } = useRuleFilters(allRules)
  const {
    sortedRules,
    groupByKey,
    setGroupByKey,
    sortKey,
    setSortKey,
    direction,
    toggleDirection,
    reset,
  } = useRuleGroupBySort(filteredRules)

  const weekdayConditionsMap = useMemo(() => {
    const map = new Map<string, RuleConditionOutput>()
    for (const rule of Object.values(rules)) {
      if (!rule.shiftTypeId)
        continue
      const shiftType = shiftTypes.find(st => st.id === rule.shiftTypeId)
      if (!shiftType)
        continue
      const weekdayCondition: RuleConditionOutput | null
        = getShiftTypeWeekdayCondition(rule, shiftType)
      if (!weekdayCondition)
        continue
      map.set(rule.id, weekdayCondition)
    }
    return map
  }, [shiftTypes, rules])

  const handleCreateRule = () => {
    if (team.id === undefined)
      return
    createRule({
      teamId: team.id,
      scope: RuleScopeValues.GLOBAL,
      payGradeId: null,
      shiftTypeId: null,
      teamMemberId: null,
      metric: RuleMetricValues.DAYS_WORKED,
      operator: RuleOperatorValues.MIN,
      threshold: 1,
      timeWindow: RuleTimeWindowValues.PER_WEEK,
      hardConstraint: true,
      active: false,
    })
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant='secondary'>
          <WorkflowIcon />
          {t('lengthRules', '{{length}} rules', {
            length: rules
              ? Object.values(rules).filter(r => r.active).length
              : 0,
          })}
          <ChevronDown />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align='start'
        className='border-border flex max-h-[40rem] min-h-0 min-w-fit flex-col border p-0 shadow-2xl '
      >
        <Command>
          <div className='flex w-full gap-1 p-2'>
            {/* rule search bar */}
            <CommandInput
              className='w-full'
              placeholder={t('searchRules', 'Search rules...')}
            />
            {/* rule filter dropdown menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='secondary' size='icon-lg'>
                  <ListFilterIcon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuLabel>
                  {t('filterBy', 'Filter by')}
                </DropdownMenuLabel>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <LoaderIcon />
                    {t('status', 'Status')}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuCheckboxItem
                      checked={filters.activeList?.includes(true) ?? false}
                      onCheckedChange={() => toggleActive(true)}
                      onSelect={preventCloseOnSelect}
                    >
                      <CircleIcon />
                      {t('isActive', 'Active')}
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={filters.activeList?.includes(false) ?? false}
                      onCheckedChange={() => toggleActive(false)}
                      onSelect={preventCloseOnSelect}
                    >
                      <CircleDashedIcon />
                      {t('isInactive', 'Inactive')}
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <UserRoundCheckIcon />
                    {t('scope', 'Scope')}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuGroup>
                      {Object.values(RuleScopeValues).map((value) => {
                        const Icon = RULE_SCOPE_ICONS[value]
                        return (
                          <DropdownMenuCheckboxItem
                            key={value}
                            checked={
                              filters.scopeList?.includes(value) ?? false
                            }
                            onCheckedChange={() => toggleScope(value)}
                            onSelect={preventCloseOnSelect}
                          >
                            <Icon />
                            {t(value, RULE_SCOPE_LABELS[value])}
                          </DropdownMenuCheckboxItem>
                        )
                      })}
                    </DropdownMenuGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <GaugeIcon />
                    {t('metric', 'Metric')}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuGroup>
                      {Object.values(RuleMetricValues).map((value) => {
                        return (
                          <DropdownMenuCheckboxItem
                            key={value}
                            checked={
                              filters.metricList?.includes(value) ?? false
                            }
                            onCheckedChange={() => toggleMetric(value)}
                            onSelect={preventCloseOnSelect}
                          >
                            {t(value, RULE_METRIC_LABELS[value])}
                          </DropdownMenuCheckboxItem>
                        )
                      })}
                    </DropdownMenuGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <Button
                  className='text-muted-foreground w-full'
                  variant='ghost'
                >
                  {t('clearFilters', 'Clear filters')}
                </Button>
              </DropdownMenuContent>
            </DropdownMenu>
            {/* rule sort */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant='secondary' size='icon-lg'>
                  <Settings2Icon />
                </Button>
              </PopoverTrigger>
              <PopoverContent align='end' className='max-w-max p-0'>
                <Command>
                  <div className='*:odd:text-muted-foreground grid grid-cols-2 gap-2 p-2 *:flex *:w-full *:min-w-0 *:flex-1 *:items-center'>
                    <div>{t('grouping')}</div>
                    <Select
                      value={groupByKey ?? 'undefined'}
                      onValueChange={value =>
                        value === 'undefined'
                          ? setGroupByKey(undefined)
                          : setGroupByKey(value as RuleGroupByKey)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value='undefined'>
                            {t('noGrouping', 'No grouping')}
                          </SelectItem>
                          {RULE_GROUP_BY_KEYS.map(groupByKey => (
                            <SelectItem key={groupByKey} value={groupByKey}>
                              {t(groupByKey)}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <div className='flex justify-between gap-2'>
                      <div>{t('sorting')}</div>
                      <Button
                        hidden={sortKey === undefined}
                        variant='ghost'
                        size='icon-sm'
                        onClick={toggleDirection}
                      >
                        <ArrowDownNarrowWideIcon
                          className={cn(
                            'hidden',
                            sortKey && direction === 'asc' && 'flex',
                          )}
                        />
                        <ArrowUpWideNarrowIcon
                          className={cn(
                            'hidden',
                            sortKey && direction === 'desc' && 'flex',
                          )}
                        />
                      </Button>
                    </div>

                    <Select
                      value={sortKey ?? 'undefined'}
                      onValueChange={value =>
                        value === 'undefined'
                          ? setSortKey(undefined)
                          : setSortKey(value as RuleSortKey)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value='undefined'>
                            {t('created', 'Created')}
                          </SelectItem>
                          {RULE_SORT_KEYS.map(sortKey => (
                            <SelectItem key={sortKey} value={sortKey}>
                              {t(sortKey)}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  <CommandSeparator />
                  <Button onClick={reset} variant='ghost'>
                    {t('reset', 'Reset')}
                  </Button>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <CommandSeparator />
          <ScrollArea className='group/rules flex min-w-fit flex-col overflow-x-clip overflow-y-auto'>
            {sortedRules && Object.keys(sortedRules).length
              ? (
                  Object.entries(sortedRules).map(([ruleId, rule]) => (
                    <div key={ruleId}>
                      <CommandItem
                        noHighlight
                        value={getRuleSearchValue(
                          rule,
                          ruleConditions ? ruleConditions[rule.id] || [] : [],
                          scopeOptions,
                        )}
                        className='pr-4'
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
                          scopeOptions={scopeOptions}
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
                )
              : (
                  <div className='text-muted-foreground p-4'>
                    {t('noRulesFound', 'No rules found.')}
                  </div>
                )}
          </ScrollArea>
          <CommandSeparator />
          <div className='flex w-full p-2'>
            <Button
              className='w-full'
              variant='secondary'
              onClick={handleCreateRule}
            >
              <Plus />
              {t('addRule', 'Add rule')}
            </Button>
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export default RulePanelPopoverButton
