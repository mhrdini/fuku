'use client'

import { RuleOutput, RuleUpdateInput } from '@fuku/api/schemas'
import { RuleTargetValues } from '@fuku/domain/schemas'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from '@fuku/ui/components'

import { buildTargetIdUpdate, buildTargetTypeUpdate } from './rule.helpers'

const RuleScopeSelect = ({
  rule,
  targetOptions,
  updateRule,
}: {
  rule: RuleOutput
  targetOptions: Record<string, { value: string; label: string }[]>
  updateRule: (rule: RuleUpdateInput) => Promise<RuleOutput>
}) => {
  const handleUpdateActive = (active: boolean) => {
    updateRule({ ...rule, active })
  }

  const handleUpdateTargetType = (target: string) => {
    if (target === rule.target) return
    updateRule({
      ...rule,
      ...buildTargetTypeUpdate(rule, target, targetOptions),
    })
  }

  const handleUpdateTargetId = (id: string) => {
    const update = buildTargetIdUpdate(rule, id)
    if (update) updateRule({ ...rule, ...update })
  }

  return (
    <>
      {/* target type*/}
      <Select value={rule.target} onValueChange={handleUpdateTargetType}>
        <SelectTrigger size='sm' variant='secondary'>
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
        <SelectTrigger size='sm' variant='secondary'>
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
      <Switch
        className='ml-auto'
        checked={rule.active}
        onCheckedChange={handleUpdateActive}
      />
    </>
  )
}

export default RuleScopeSelect
