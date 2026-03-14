import { useEffect, useMemo, useState } from 'react'
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
} from '@fuku/api/schemas'

import { MutationMode } from '~/lib/query'

type RuleEditorProps = {
  initialRules: Record<string, RuleOutput>
  initialRuleConditions: Record<string, RuleConditionOutput[]>
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

export const useRuleEditor = ({
  initialRules,
  initialRuleConditions,
  teamMembers,
  shiftTypes,
  payGrades,
  mutateRule,
  mutateRuleCondition,
}: RuleEditorProps) => {
  const [rules, setRules] = useState<Record<string, RuleOutput>>(initialRules)
  const [ruleConditions, setRuleConditions] = useState<
    Record<string, RuleConditionOutput[]>
  >(initialRuleConditions)

  useEffect(() => {
    setRules(initialRules)
  }, [initialRules])

  useEffect(() => {
    setRuleConditions(initialRuleConditions)
  }, [initialRuleConditions])

  const targetOptions = useMemo(
    () => ({
      TEAM_MEMBER: teamMembers.map(m => ({
        value: m.id,
        label: `${m.givenNames}${m.familyName ? ` ${m.familyName}` : ''}`,
      })),

      PAY_GRADE: payGrades.map(p => ({
        value: p.id,
        label: p.name,
      })),

      SHIFT_TYPE: shiftTypes.map(s => ({
        value: s.id,
        label: s.name,
      })),

      GLOBAL: [],
    }),
    [teamMembers, shiftTypes, payGrades],
  )

  // Rules
  const createRule = async (rule: RuleCreateInput): Promise<RuleOutput> => {
    const created = await mutateRule('create', rule)
    setRules(prev => ({ ...prev, [created.id]: created }))
    requestAnimationFrame(() => {
      const el = document.getElementById(`rule-${created.id}`)
      el?.focus()
      el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      el?.classList.add('animate-rule-flash')
      setTimeout(() => {
        el?.classList.remove('animate-rule-flash')
      }, 1200)
    })
    // for now, create rule conditions on this layer, not in API layer

    const ruleConditions: RuleConditionOutput[] = []
    for (const condition of rule.ruleConditions ?? []) {
      await createRuleCondition({
        ...condition,
        ruleId: created.id,
      })
    }
    setRuleConditions(prev => ({
      ...prev,
      [created.id]: ruleConditions,
    }))

    return created
  }

  const updateRule = async (rule: RuleUpdateInput): Promise<RuleOutput> => {
    setRules(prev => ({ ...prev, [rule.id]: { ...prev[rule.id], ...rule } }))
    return await mutateRule('update', rule)
  }

  const deleteRule = async (ruleId: string): Promise<RuleOutput> => {
    setRules(prev => {
      const { [ruleId]: _, ...updated } = prev
      return updated
    })

    const deleted = await mutateRule('delete', ruleId)

    setRuleConditions(prev => {
      const next = { ...prev }
      delete next[ruleId]
      return next
    })

    return deleted
  }

  // Rule Conditions
  const createRuleCondition = async (
    condition: RuleConditionCreateInput,
  ): Promise<RuleConditionOutput> => {
    const created = await mutateRuleCondition('create', condition)
    setRuleConditions(prev => ({
      ...prev,
      [created.ruleId]: [...(prev[created.ruleId] ?? []), created],
    }))
    return created
  }

  const updateRuleCondition = async (
    condition: RuleConditionUpdateInput,
  ): Promise<RuleConditionOutput> => {
    setRuleConditions(prev => ({
      ...prev,
      [condition.ruleId]: prev[condition.ruleId].map(c =>
        c.id === condition.id ? { ...c, ...condition } : c,
      ),
    }))
    return await mutateRuleCondition('update', condition)
  }

  const deleteRuleCondition = async (
    conditionId: string,
  ): Promise<RuleConditionOutput> => {
    const deleted = await mutateRuleCondition('delete', conditionId)
    setRuleConditions(prev => ({
      ...prev,
      [deleted.ruleId]: prev[deleted.ruleId].filter(c => c.id !== deleted.id),
    }))
    return deleted
  }

  return {
    rules,
    ruleConditions,

    createRule,
    updateRule,
    deleteRule,

    createRuleCondition,
    updateRuleCondition,
    deleteRuleCondition,

    targetOptions,
  }
}
