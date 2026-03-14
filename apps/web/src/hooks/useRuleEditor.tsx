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
  const createRule = async (rule: RuleCreateInput) => {
    const created = await mutateRule('create', rule)
    setRules(prev => ({ ...prev, [created.id]: created }))
  }

  const updateRule = async (rule: RuleUpdateInput) => {
    setRules(prev => ({ ...prev, [rule.id]: { ...prev[rule.id], ...rule } }))
    await mutateRule('update', rule)
  }

  const deleteRule = async (ruleId: string) => {
    setRules(prev => {
      const { [ruleId]: _, ...updated } = prev
      return updated
    })

    await mutateRule('delete', ruleId)

    setRuleConditions(prev => {
      const next = { ...prev }
      delete next[ruleId]
      return next
    })
  }

  // Rule Conditions
  const createRuleCondition = async (condition: RuleConditionCreateInput) => {
    const created = await mutateRuleCondition('create', condition)
    setRuleConditions(prev => ({
      ...prev,
      [created.ruleId]: [...(prev[created.ruleId] ?? []), created],
    }))
  }

  const updateRuleCondition = async (condition: RuleConditionUpdateInput) => {
    setRuleConditions(prev => ({
      ...prev,
      [condition.ruleId]: prev[condition.ruleId].map(c =>
        c.id === condition.id ? { ...c, ...condition } : c,
      ),
    }))
    await mutateRuleCondition('update', condition)
  }

  const deleteRuleCondition = async (conditionId: string) => {
    const deleted = await mutateRuleCondition('delete', conditionId)
    setRuleConditions(prev => ({
      ...prev,
      [deleted.ruleId]: prev[deleted.ruleId].filter(c => c.id !== deleted.id),
    }))
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
