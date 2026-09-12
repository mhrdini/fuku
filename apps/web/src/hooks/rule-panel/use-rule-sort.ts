import { useMemo, useState } from 'react'
import { RuleOutput } from '@fuku/api/schemas'

import { RuleSortKey, sortRules } from '~/lib/rule-panel/rule.helpers' // adjust path

export function useRuleSort(
  rules: RuleOutput[],
  initialSortKey: RuleSortKey | null = null,
) {
  const [sortKey, setSortKey] = useState<RuleSortKey | null>(initialSortKey)
  const [direction, setDirection] = useState<'asc' | 'desc'>('asc')

  const toggleDirection = () =>
    setDirection(d => (d === 'asc' ? 'desc' : 'asc'))

  const sortedRules = useMemo(() => {
    if (!sortKey) return rules
    return sortRules(rules, sortKey, direction)
  }, [rules, sortKey, direction])

  return {
    sortedRules,
    sortKey,
    setSortKey,
    direction,
    setDirection,
    toggleDirection,
  }
}
