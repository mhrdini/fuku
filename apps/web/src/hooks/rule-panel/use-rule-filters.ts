import { useMemo, useState } from 'react'
import { RuleOutput } from '@fuku/api/schemas'
import { RuleMetric, RuleTarget } from '@fuku/domain/schemas'

import {
  matchesRuleFilters,
  RuleFilters,
  toggleListValue,
} from '~/lib/rule-panel/rule.helpers'

// adjust to your actual path

export function useRuleFilters(rules: RuleOutput[]) {
  const [filters, setFilters] = useState<RuleFilters>({})

  const toggleTarget = (target: RuleTarget) =>
    setFilters(prev => ({
      ...prev,
      targetList: toggleListValue(prev.targetList, target),
    }))

  const toggleMetric = (metric: RuleMetric) =>
    setFilters(prev => ({
      ...prev,
      metricList: toggleListValue(prev.metricList, metric),
    }))

  const toggleActive = (active: boolean) =>
    setFilters(prev => ({
      ...prev,
      activeList: toggleListValue(prev.activeList, active),
    }))

  const toggleHardConstraint = (hardConstraint: boolean) =>
    setFilters(prev => ({
      ...prev,
      hardConstraintList: toggleListValue(
        prev.hardConstraintList,
        hardConstraint,
      ),
    }))

  const clearFilters = () => setFilters({})

  const hasActiveFilters = useMemo(
    () => Object.values(filters).some(list => list && list.length > 0),
    [filters],
  )

  const filteredRules = useMemo(
    () => rules.filter(rule => matchesRuleFilters(rule, filters)),
    [rules, filters],
  )

  return {
    filteredRules,
    filters,
    toggleTarget,
    toggleMetric,
    toggleActive,
    toggleHardConstraint,
    clearFilters,
    hasActiveFilters,
  }
}
