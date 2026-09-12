'use client'

import { RuleOutput, RuleUpdateInput } from '@fuku/api/schemas'
import {
  RuleMetricSchema,
  RuleMetricValues,
  RuleOperatorSchema,
  RuleOperatorValues,
  RuleTimeWindowSchema,
  RuleTimeWindowValues,
} from '@fuku/domain/schemas'
import { useTranslation } from '@fuku/i18n/react'
import {
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@fuku/ui/components'

import { useCommittedNumberField } from './use-committed-number-field'

const RuleMetricEditor = ({
  rule,
  updateRule,
}: {
  rule: RuleOutput
  updateRule: (rule: RuleUpdateInput) => Promise<RuleOutput>
}) => {
  const { t } = useTranslation()

  const threshold = useCommittedNumberField(rule.threshold, num =>
    updateRule({ ...rule, threshold: num! } as RuleUpdateInput),
  )

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

  const handleUpdateRuleTimeWindow = (timeWindow: string) => {
    if (timeWindow === rule.timeWindow) return
    updateRule({
      ...rule,
      timeWindow: RuleTimeWindowSchema.parse(timeWindow),
    } as RuleUpdateInput)
  }

  return (
    <>
      {/* metric */}
      <Select value={rule.metric} onValueChange={handleUpdateRuleMetric}>
        <SelectTrigger size='sm' variant='secondary'>
          <SelectValue placeholder={t('rulemetric', 'RuleMetric')} />
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
        <SelectTrigger size='sm' variant='secondary'>
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
        variant='chip'
        value={threshold.input}
        onChange={e => threshold.setInput(e.target.value)}
        onBlur={threshold.commit}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === 'Escape') threshold.commit()
        }}
      />
      {/* per */}
      <span>/</span>
      {/* time window */}
      <Select
        value={rule.timeWindow}
        onValueChange={handleUpdateRuleTimeWindow}
      >
        <SelectTrigger size='sm' variant='secondary'>
          <SelectValue placeholder={t('timeWindow', 'Time Window')} />
        </SelectTrigger>
        <SelectContent>
          {Object.values(RuleTimeWindowValues).map(value => (
            <SelectItem key={value} value={value}>
              {value}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  )
}

export default RuleMetricEditor
