'use client'

import {
  getRuleConditionDefaultValueByField,
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
import { ChevronRightIcon, CopyIcon, PlusIcon, TrashIcon } from 'lucide-react'

import type {
  RuleConditionCreateInput,
  RuleConditionOutput,
  RuleConditionUpdateInput,
  RuleCreateInput,
  RuleOutput,
  RuleUpdateInput,
} from '@fuku/api/schemas'
import type {
  RULE_CONDITION_OPTIONS_CONFIG,
} from '@fuku/domain/schemas'

import RuleConditionPanelItem from './rule-condition-panel-item'
import RuleConstraintEditor from './rule-constraint-editor'
import RuleMetricEditor from './rule-metric-editor'
import RuleScopeSelect from './rule-scope-select'

function RulePanelItem({
  rule,
  ruleConditions,
  scopeOptions,
  createRule,
  updateRule,
  deleteRule,
  createRuleCondition,
  updateRuleCondition,
  deleteRuleCondition,
}: {
  rule: RuleOutput
  ruleConditions: RuleConditionOutput[]
  scopeOptions: Record<string, { value: string, label: string }[]>
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
}) {
  const { t } = useTranslation()

  const handleDeleteRule = () => {
    deleteRule(rule.id)
  }

  const handleDuplicateRule = () => {
    const { id: _id, ...rest } = rule
    const newRule = {
      ...rest,
      ruleConditions: ruleConditions.map(
        ({ id: _id, ruleId: _ruleId, ...condition }) => condition,
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
      <div className='flex flex-col items-start  gap-2 *:flex *:w-full *:flex-row *:items-center *:justify-start *:gap-2'>
        {/* first row */}
        <div>
          <RuleScopeSelect
            rule={rule}
            scopeOptions={scopeOptions}
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
                <CopyIcon />
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
                <TrashIcon />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('delete', 'Delete')}</TooltipContent>
          </Tooltip>
        </div>
        <div>
          <CollapsibleTrigger asChild>
            <Button variant='link'>
              <ChevronRightIcon className=' transition-transform duration-300 ease-in-out group-data-[state=open]/rule:rotate-90' />
              {t('lengthConditions', '{{length}} conditions', {
                length: ruleConditions.length,
              })}
            </Button>
          </CollapsibleTrigger>
        </div>
      </div>
      <CollapsibleContent className='flex w-full min-w-0 flex-col gap-2 rounded-b-none p-0 pt-2'>
        {ruleConditions.map(rc => (
          <RuleConditionPanelItem
            key={rc.id}
            ruleCondition={rc}
            updateRuleCondition={updateRuleCondition}
            deleteRuleCondition={deleteRuleCondition}
          />
        ))}
        <Button variant='secondary' size='sm' onClick={handleCreateCondition}>
          <PlusIcon />
          {t('addCondition', 'Add condition')}
        </Button>
      </CollapsibleContent>
    </Collapsible>
  )
}

export default RulePanelItem
