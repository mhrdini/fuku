'use client'

import { RuleScopeValues } from '@fuku/domain/schemas'
import { useTranslation } from '@fuku/i18n/react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from '@fuku/ui/components'

import type { RuleOutput, RuleUpdateInput } from '@fuku/api/schemas'

import { RULE_SCOPE_LABELS } from '~/lib/rule-panel/rule.constants'
import {
  buildScopeIdUpdate,
  buildScopeTypeUpdate,
} from '~/lib/rule-panel/rule.helpers'

function RuleScopeSelect({
  rule,
  scopeOptions,
  updateRule,
}: {
  rule: RuleOutput
  scopeOptions: Record<string, { value: string, label: string }[]>
  updateRule: (rule: RuleUpdateInput) => Promise<RuleOutput>
}) {
  const { t } = useTranslation()

  const handleUpdateActive = (active: boolean) => {
    updateRule({ ...rule, active })
  }

  const handleUpdateScopeType = (scope: string) => {
    if (scope === rule.scope)
      return
    updateRule({
      ...rule,
      ...buildScopeTypeUpdate(rule, scope, scopeOptions),
    })
  }

  const handleUpdateScopeId = (id: string) => {
    const update = buildScopeIdUpdate(rule, id)
    if (update)
      updateRule({ ...rule, ...update })
  }

  return (
    <>
      {/* scope type */}
      <Select value={rule.scope} onValueChange={handleUpdateScopeType}>
        <SelectTrigger size='sm' variant='secondary'>
          <SelectValue placeholder={t('scope')} />
        </SelectTrigger>
        <SelectContent>
          {Object.values(RuleScopeValues)
            .filter(
              value =>
                scopeOptions[value].length > 0
                || value === RuleScopeValues.GLOBAL,
            )
            .map(value => (
              <SelectItem key={value} value={value}>
                {t(value, RULE_SCOPE_LABELS[value])}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
      {/* scope selection, dependent on scope */}
      <Select
        disabled={rule.scope === RuleScopeValues.GLOBAL}
        value={
          rule.scope === RuleScopeValues.GLOBAL
            ? undefined
            : rule.scope === RuleScopeValues.TEAM_MEMBER
              ? (rule.teamMemberId ?? undefined)
              : rule.scope === RuleScopeValues.PAY_GRADE
                ? (rule.payGradeId ?? undefined)
                : (rule.shiftTypeId ?? undefined)
        }
        onValueChange={handleUpdateScopeId}
      >
        <SelectTrigger size='sm' variant='secondary'>
          <SelectValue placeholder={t('scope')} />
        </SelectTrigger>
        <SelectContent>
          {scopeOptions[rule.scope].map(({ value, label }) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Switch
        className='ml-auto'
        checked={rule.active}
        onCheckedChange={handleUpdateActive}
      />
    </>
  )
}

export default RuleScopeSelect
