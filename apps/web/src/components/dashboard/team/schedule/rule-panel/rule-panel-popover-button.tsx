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
import { useTranslation } from '@fuku/i18n/react'
import {
  Button,
  Command,
  CommandInput,
  CommandItem,
  CommandSeparator,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ScrollArea,
} from '@fuku/ui/components'
import { ChevronDown, ListFilter, Plus } from 'lucide-react'

import { useRuleEditor } from '~/hooks/useRuleEditor'
import { MutationMode } from '~/lib/query'
import RulePanelItem from './rule-panel-item'
import { WEEKDAY_CONDITION_ID_PREFIX } from './rule.constants'

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

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant='secondary'>
          <ListFilter />
          {rules ? Object.values(rules).filter(r => r.active).length : 0} rules
          <ChevronDown />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align='start'
        className='min-w-fit min-h-0 flex flex-col max-h-[40rem] p-0 border border-border shadow-2xl '
      >
        <Command>
          <div className='p-2 w-full flex'>
            <CommandInput
              className='w-full'
              placeholder={t('searchRules', 'Search rules...')}
            />
          </div>
          <CommandSeparator />
          <ScrollArea className='group/rules flex flex-col min-w-fit overflow-y-auto overflow-x-clip'>
            {rules && Object.keys(rules).length ? (
              Object.entries(rules).map(([ruleId, rule]) => (
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
