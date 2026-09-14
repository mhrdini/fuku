import { useMemo, useState } from 'react'
import { RuleOutput } from '@fuku/api/schemas'

import {
  groupRules,
  RuleGroupByKey,
  RuleSortKey,
  sortRules,
} from '~/lib/rule-panel/rule.helpers'

// adjust path

export function useRuleGroupBySort(
  rules: RuleOutput[],
  initialSortKey: RuleSortKey | undefined = undefined,
  initialGroupByKey: RuleGroupByKey | undefined = undefined,
) {
  const [sortKey, setSortKey] = useState<RuleSortKey | undefined>(
    initialSortKey,
  )
  const [direction, setDirection] = useState<'asc' | 'desc'>('asc')

  const [groupByKey, setGroupByKey] = useState<RuleGroupByKey | undefined>(
    initialGroupByKey,
  )

  const toggleDirection = () =>
    setDirection(d => (d === 'asc' ? 'desc' : 'asc'))

  const reset = () => {
    setDirection('asc')
    setGroupByKey(undefined)
    setSortKey(undefined)
  }

  const sortedRules = useMemo(() => {
    return groupRules(rules, groupByKey).flatMap(rules =>
      sortRules(rules, sortKey, direction),
    )
  }, [rules, sortKey, groupByKey, direction])

  return {
    sortedRules,
    groupByKey,
    setGroupByKey,
    sortKey,
    setSortKey,
    direction,
    setDirection,
    toggleDirection,
    reset,
  }
}
