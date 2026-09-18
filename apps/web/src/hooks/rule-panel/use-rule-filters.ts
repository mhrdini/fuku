import { useMemo, useState } from 'react'

import type { RuleOutput } from '@fuku/api/schemas'
import type { RuleMetric, RuleScope } from '@fuku/domain/schemas'

import type {
  RuleFilters,
} from '~/lib/rule-panel/rule.helpers'
import {
  matchesRuleFilters,
  toggleListValue,
} from '~/lib/rule-panel/rule.helpers'

// adjust to your actual path

export function useRuleFilters(rules: RuleOutput[]) {
  const [filters, setFilters] = useState<RuleFilters>({})

  const toggleScope = (scope: RuleScope) =>
    setFilters(prev => ({
      ...prev,
      scopeList: toggleListValue(prev.scopeList, scope),
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
    toggleScope,
    toggleMetric,
    toggleActive,
    toggleHardConstraint,
    clearFilters,
    hasActiveFilters,
  }
}
