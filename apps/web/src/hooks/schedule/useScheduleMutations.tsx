import {
  RuleConditionCreateInput,
  RuleConditionOutput,
  RuleConditionUpdateInput,
  RuleCreateInput,
  RuleOutput,
  RuleUpdateInput,
  TeamOutput,
} from '@fuku/api/schemas'
import {
  GenerateScheduleInput,
  GenerateScheduleOutput,
} from '@fuku/domain/schemas'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { DateTime } from 'luxon'

import { getCellKey } from '~/lib/schedule'
import { useScheduleStore } from '~/store/schedule.store'
import { useTRPC } from '~/trpc/client'

interface ScheduleMutationsProps {
  team: TeamOutput | undefined
  start: Date
  end: Date
}

export const useScheduleMutations = ({
  team,
  start,
  end,
}: ScheduleMutationsProps) => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const {
    setSchedulerAssignments,
    schedulerAssignments,
    schedulerUnavailabilities,
  } = useScheduleStore()

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
          return [...oldData, data]
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

    const country = team.country
    const timeZone = team.timeZone

    const startDate = DateTime.fromJSDate(start).startOf('day').toMillis()
    const endDate = DateTime.fromJSDate(end).endOf('day').toMillis()

    const unavailabilities = schedulerUnavailabilities
      .filter(u => {
        const unavailabilityDate = DateTime.fromJSDate(
          new Date(u.date),
        ).toMillis()
        return unavailabilityDate >= startDate && unavailabilityDate <= endDate
      })
      .map(u => ({
        ...u,
        date: new Date(u.date),
      }))

    const unavailabilityMap = new Map(
      unavailabilities.map(u => [getCellKey(u.teamMemberId, u.date), u]),
    )

    const assignments = schedulerAssignments
      .filter(a => {
        const assignmentDate = DateTime.fromJSDate(new Date(a.date)).toMillis()
        return (
          !unavailabilityMap.has(getCellKey(a.teamMemberId, a.date)) &&
          assignmentDate >= startDate &&
          assignmentDate <= endDate
        )
      })
      .map(a => ({
        ...a,
        date: new Date(a.date),
      }))

    const input: GenerateScheduleInput = {
      teamId: team?.id ?? '',
      start: DateTime.fromJSDate(start).toISODate()!,
      end: DateTime.fromJSDate(end).toISODate()!,
      country,
      timeZone,
      assignments: assignments.length > 0 ? assignments : undefined,
      unavailabilities:
        unavailabilities.length > 0 ? unavailabilities : undefined,
    }

    console.log('Generating schedule with parameters:', input)

    generateSchedule(input)
  }

  return {
    generateSchedule,
    handleGenerateSchedule,
    isGenerating,
    handleMutateRule,
    handleMutateRuleCondition,
    createUnavailability,
    deleteUnavailability,
  }
}

export type ScheduleMutations = ReturnType<typeof useScheduleMutations>
