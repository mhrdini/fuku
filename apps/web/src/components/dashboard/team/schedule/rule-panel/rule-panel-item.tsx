'use client'

import {
  RuleConditionCreateInput,
  RuleConditionOutput,
  RuleConditionUpdateInput,
  RuleCreateInput,
  RuleOutput,
  RuleUpdateInput,
} from '@fuku/api/schemas'
import {
  getRuleConditionDefaultValueByField,
  RULE_CONDITION_OPTIONS_CONFIG,
  RuleConditionFieldValues,
  RuleConditionOperatorValues,
} from '@fuku/domain/schemas'
import { useTranslation } from '@fuku/i18n/react'
import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@fuku/ui/components'
import { ChevronRight, Copy, Plus, Trash } from 'lucide-react'

import RuleConditionPanelItem from './rule-condition-panel-item'
import RuleConstraintEditor from './rule-constraint-editor'
import RuleMetricEditor from './rule-metric-editor'
import RuleScopeSelect from './rule-scope-select'

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
  const { t } = useTranslation()

  const handleDeleteRule = () => {
    deleteRule(rule.id)
  }

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
    <Collapsible id={`rule-${rule.id}`} className='group/rule w-full'>
      <div className='flex flex-col gap-2  items-start *:flex *:flex-row *:gap-2 *:items-center *:justify-start *:w-full'>
        {/* first row */}
        <div>
          <RuleScopeSelect
            rule={rule}
            targetOptions={targetOptions}
            updateRule={updateRule}
          />
        </div>
        {/* second row */}
        <div>
          <RuleMetricEditor rule={rule} updateRule={updateRule} />
        </div>
        {/* third row */}
        <div>
          <RuleConstraintEditor rule={rule} updateRule={updateRule} />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size='icon-sm'
                variant='ghost'
                className='ml-auto'
                onClick={handleDuplicateRule}
              >
                <Copy />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('duplicate', 'Duplicate')}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size='icon-sm'
                variant='error-ghost'
                onClick={handleDeleteRule}
              >
                <Trash />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('delete', 'Delete')}</TooltipContent>
          </Tooltip>
        </div>
        <div>
          <CollapsibleTrigger asChild>
            <Button variant='link'>
              <ChevronRight className=' transition-transform duration-300 ease-in-out group-data-[state=open]/rule:rotate-90' />
              {t('lengthConditions', '{{length}} conditions', {
                length: ruleConditions.length,
              })}
            </Button>
          </CollapsibleTrigger>
        </div>
      </div>
      <CollapsibleContent className='p-0 pt-2 flex flex-col w-full min-w-0 rounded-b-none gap-2'>
        {ruleConditions.map(rc => (
          <RuleConditionPanelItem
            key={rc.id}
            ruleCondition={rc}
            updateRuleCondition={updateRuleCondition}
            deleteRuleCondition={deleteRuleCondition}
          />
        ))}
        <Button variant='secondary' size='sm' onClick={handleCreateCondition}>
          <Plus />
          {t('addCondition', 'Add condition')}
        </Button>
      </CollapsibleContent>
    </Collapsible>
  )
}

export default RulePanelItem
