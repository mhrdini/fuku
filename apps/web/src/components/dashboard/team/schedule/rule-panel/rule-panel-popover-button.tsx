'use client'

import { useMemo } from 'react'
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
  RuleMetricValues,
  RuleOperatorValues,
  RuleTargetValues,
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
import {
  ChevronDown,
  CircleDashedIcon,
  CircleIcon,
  GaugeIcon,
  ListFilter,
  LoaderIcon,
  Plus,
  Settings2Icon,
  UserRoundCheckIcon,
} from 'lucide-react'

import { useRuleEditor } from '~/hooks/rule-panel/use-rule-editor'
import { useRuleFilters } from '~/hooks/rule-panel/use-rule-filters'
import { useRuleGroupBySort } from '~/hooks/rule-panel/use-rule-group-by-sort'
import { MutationMode } from '~/lib/query'
import {
  RULE_GROUP_BY_KEYS,
  RULE_METRIC_LABELS,
  RULE_SORT_KEYS,
  RULE_TARGET_ICONS,
  RULE_TARGET_LABELS,
  WEEKDAY_CONDITION_ID_PREFIX,
} from '~/lib/rule-panel/rule.constants'
import {
  RuleGroupByKey,
  RuleSortKey,
} from '~/lib/rule-panel/rule.helpers'
import RulePanelItem from './rule-panel-item'

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

  return [
    i18next.t(rule.metric),
    i18next.t(rule.timeWindow),
    i18next.t(rule.operator),
    i18next.t(rule.target),
    targetLabel,
    rule.hardConstraint ? i18next.t('required') : i18next.t('preferred'),
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

  const allRules = useMemo(() => Object.values(rules), [rules])
  const {
    filteredRules,
    filters,
    toggleActive,
    toggleTarget,
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
  } = useRuleGroupBySort(filteredRules)

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
      active: false,
    })
  }

  const preventCloseOnSelect = (e: Event) => e.preventDefault()

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant='secondary'>
          <ListFilter />
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
        className='min-w-fit min-h-0 flex flex-col max-h-[40rem] p-0 border border-border shadow-2xl '
      >
        <Command>
          <div className='p-2 w-full flex gap-1'>
            {/* rule search bar */}
            <CommandInput
              className='w-full'
              placeholder={t('searchRules', 'Search rules...')}
            />
            {/* rule filter dropdown menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='secondary' size='icon-lg'>
                  <ListFilter />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuLabel>
                  {(t('filterBy'), 'Filter by')}
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
                      {Object.values(RuleTargetValues).map(value => {
                        const Icon = RULE_TARGET_ICONS[value]
                        return (
                          <DropdownMenuCheckboxItem
                            key={value}
                            checked={
                              filters.targetList?.includes(value) ?? false
                            }
                            onCheckedChange={() => toggleTarget(value)}
                            onSelect={preventCloseOnSelect}
                          >
                            <Icon />
                            {t(value, RULE_TARGET_LABELS[value])}
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
                      {Object.values(RuleMetricValues).map(value => {
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
                  <div className='p-2 grid gap-2 grid-cols-2 *:flex *:items-center *:min-w-0 *:flex-1 *:w-full *:odd:text-muted-foreground'>
                    <div>Grouping</div>
                    <Select
                      value={groupByKey ?? 'undefined'}
                      onValueChange={value =>
                        value === 'undefined'
                          ? setGroupByKey(undefined)
                          : setGroupByKey(value as RuleGroupByKey)
                      }
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
                    <div>Sorting</div>
                    <Select
                      value={sortKey ?? 'undefined'}
                      onValueChange={value =>
                        value === 'undefined'
                          ? setSortKey(undefined)
                          : setSortKey(value as RuleSortKey)
                      }
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
                  <Button variant='ghost'>{t('reset', 'Reset')}</Button>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <CommandSeparator />
          <ScrollArea className='group/rules flex flex-col min-w-fit overflow-y-auto overflow-x-clip'>
            {sortedRules && Object.keys(sortedRules).length ? (
              Object.entries(sortedRules).map(([ruleId, rule]) => (
                <div key={ruleId}>
                  <CommandItem
                    noHighlightOnSelected
                    value={getRuleSearchValue(
                      rule,
                      ruleConditions ? ruleConditions[rule.id] || [] : [],
                      targetOptions,
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
              <div className='text-muted-foreground p-4'>
                {t('noRulesFound', 'No rules found.')}
              </div>
            )}
          </ScrollArea>
          <CommandSeparator />
          <div className='p-2 w-full flex'>
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
