import { useParams } from 'next/navigation'
import {
  RuleConditionCreateInput,
  RuleConditionOutput,
  RuleConditionUpdateInput,
  RuleCreateInput,
  RuleOutput,
  RuleUpdateInput,
} from '@fuku/api/schemas'
import {
  GenerateScheduleInput,
  GenerateScheduleOutput,
} from '@fuku/domain/schemas'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useScheduleStore } from '~/store/schedule.store'
import { useTRPC } from '~/trpc/client'

export const useScheduleData = (start: Date, end: Date) => {
  const params = useParams()
  const slug = params.slug as string
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const {
    setSchedulerAssignments,
    schedulerAssignments,
    schedulerUnavailabilities,
  } = useScheduleStore()

  // API queries

  const { data: team } = useQuery({
    ...trpc.team.bySlug.queryOptions({ slug: slug! }),
    enabled: !!slug,
  })

  const { data: teamMembers } = useQuery({
    ...trpc.teamMember.list.queryOptions({ teamId: team?.id ?? '' }),
    enabled: !!team,
  })

  const { data: shiftTypes } = useQuery({
    ...trpc.shiftType.list.queryOptions({ teamId: team?.id ?? '' }),
    enabled: !!team,
  })

  const { data: payGrades } = useQuery({
    ...trpc.payGrade.list.queryOptions({ teamId: team?.id ?? '' }),
    enabled: !!team,
  })

  const { data: dbAssignments } = useQuery({
    ...trpc.assignment.list.queryOptions({
      teamId: team?.id ?? '',
      start: start,
      end: end,
    }),
    enabled: !!team,
  })

  const { data: rules } = useQuery({
    ...trpc.rule.groupById.queryOptions({ teamId: team?.id ?? '' }),
    enabled: !!team,
  })

  const { data: ruleConditions } = useQuery({
    ...trpc.ruleCondition.groupByRules.queryOptions({
      teamId: team?.id ?? '',
    }),
    enabled: !!team,
  })

  const { data: unavailabilities } = useQuery({
    ...trpc.unavailability.list.queryOptions({
      teamId: team?.id ?? '',
      start: start,
      end: end,
    }),
    enabled: !!team,
  })

  // API mutations

  const { mutateAsync: createRule } = useMutation({
    ...trpc.rule.create.mutationOptions(),
    onSuccess: data => {
      queryClient.setQueryData(
        trpc.rule.groupById.queryKey({ teamId: team?.id ?? '' }),
        (oldData: Record<string, RuleOutput> | undefined) => {
          if (!oldData) return oldData
          return { ...oldData, [data.id]: data }
        },
      )
    },
  })

  const { mutateAsync: updateRule } = useMutation({
    ...trpc.rule.update.mutationOptions(),
    onSuccess: data => {
      queryClient.setQueryData(
        trpc.rule.groupById.queryKey({ teamId: team?.id ?? '' }),
        (oldData: Record<string, RuleOutput> | undefined) => {
          if (!oldData) return oldData
          return { ...oldData, [data.id]: data }
        },
      )
    },
  })

  const { mutateAsync: deleteRule } = useMutation({
    ...trpc.rule.delete.mutationOptions(),
    onSuccess: data => {
      queryClient.setQueryData(
        trpc.rule.groupById.queryKey({ teamId: team?.id ?? '' }),
        (oldData: Record<string, RuleOutput> | undefined) => {
          if (!oldData) return oldData
          const newData = { ...oldData }
          delete newData[data.id]
          return newData
        },
      )
    },
  })

  const { mutateAsync: createRuleCondition } = useMutation({
    ...trpc.ruleCondition.create.mutationOptions(),
    onSuccess: data => {
      queryClient.setQueryData(
        trpc.ruleCondition.groupByRules.queryKey({ teamId: team?.id ?? '' }),
        oldData => {
          if (!oldData) return oldData
          const ruleConditions = oldData[data.ruleId] ?? []
          return {
            ...oldData,
            [data.ruleId]: [...ruleConditions, data],
          }
        },
      )
    },
  })

  const { mutateAsync: updateRuleCondition } = useMutation({
    ...trpc.ruleCondition.update.mutationOptions(),
    onSuccess: data => {
      queryClient.setQueryData(
        trpc.ruleCondition.groupByRules.queryKey({ teamId: team?.id ?? '' }),
        oldData => {
          if (!oldData) return oldData
          const ruleConditions = oldData[data.ruleId] ?? []
          const updatedRuleConditions = ruleConditions.map(rc =>
            rc.id === data.id ? data : rc,
          )
          return { ...oldData, [data.ruleId]: updatedRuleConditions }
        },
      )
    },
  })

  const { mutateAsync: deleteRuleCondition } = useMutation({
    ...trpc.ruleCondition.delete.mutationOptions(),
    onSuccess: data => {
      queryClient.setQueryData(
        trpc.ruleCondition.groupByRules.queryKey({ teamId: team?.id ?? '' }),
        oldData => {
          if (!oldData) return oldData
          const ruleConditions = oldData[data.ruleId] ?? []
          const updatedRuleConditions = ruleConditions.filter(
            rc => rc.id !== data.id,
          )
          return { ...oldData, [data.ruleId]: updatedRuleConditions }
        },
      )
    },
  })

  const { mutateAsync: createUnavailability } = useMutation({
    ...trpc.unavailability.create.mutationOptions(),
    onSuccess: data => {
      queryClient.setQueryData(
        trpc.unavailability.list.queryKey({
          teamId: team?.id ?? '',
          start: start,
          end: end,
        }),
        (oldData: any) => {
          if (!oldData) return oldData
        },
      )
    },
  })

  const { mutateAsync: deleteUnavailability } = useMutation({
    ...trpc.unavailability.deleteById.mutationOptions(),
    onSuccess: data => {
      queryClient.setQueryData(
        trpc.unavailability.list.queryKey({
          teamId: team?.id ?? '',
          start: start,
          end: end,
        }),
        (oldData: any) => {
          if (!oldData) return oldData
          return oldData.filter((u: any) => u.id !== data.id)
        },
      )
    },
  })

  // Unified handlers for rules and rule conditions for RulePanelPopoverButton

  const handleMutateRule = async (
    mode: 'create' | 'update' | 'delete',
    rule: RuleCreateInput | RuleUpdateInput | string,
  ): Promise<RuleOutput> => {
    switch (mode) {
      case 'create':
        return await createRule(rule as RuleCreateInput)
      case 'update':
        return await updateRule(rule as RuleUpdateInput)
      case 'delete':
        return await deleteRule({ id: rule as string })
    }
  }

  const handleMutateRuleCondition = async (
    mode: 'create' | 'update' | 'delete',
    ruleCondition: RuleConditionCreateInput | RuleConditionUpdateInput | string,
  ): Promise<RuleConditionOutput> => {
    switch (mode) {
      case 'create':
        return await createRuleCondition(
          ruleCondition as RuleConditionCreateInput,
        )
      case 'update':
        return await updateRuleCondition(
          ruleCondition as RuleConditionUpdateInput,
        )
      case 'delete':
        return await deleteRuleCondition({ id: ruleCondition as string })
    }
  }

  // Schedule generation mutation

  const { mutateAsync: generateSchedule, isPending: isGenerating } =
    useMutation({
      ...trpc.schedule.generate.mutationOptions(),
      onSuccess: (data: GenerateScheduleOutput) => {
        setSchedulerAssignments(data.assignments)
      },
    })

  const handleGenerateSchedule = () => {
    if (!team) return

    const timeZone = team.timeZone

    const assignments = schedulerAssignments.map(a => ({
      ...a,
      date: new Date(a.date),
    }))

    const unavailabilities = schedulerUnavailabilities.map(u => ({
      ...u,
      date: new Date(u.date),
    }))

    const input: GenerateScheduleInput = {
      teamId: team.id,
      start,
      end,
      timeZone,
      assignments,
      unavailabilities,
    }

    console.log('Generating schedule with parameters:', input)

    generateSchedule(input)
  }

  return {
    team,
    teamMembers,
    shiftTypes,
    payGrades,
    rules,
    ruleConditions,
    unavailabilities,
    generateSchedule,
    handleGenerateSchedule,
    isGenerating,
    handleMutateRule,
    handleMutateRuleCondition,
    createUnavailability,
    deleteUnavailability,
  }
}

export type ScheduleData = ReturnType<typeof useScheduleData>
