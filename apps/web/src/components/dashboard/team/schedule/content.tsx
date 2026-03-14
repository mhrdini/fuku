'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import {
  RuleConditionCreateInput,
  RuleConditionOutput,
  RuleConditionUpdateInput,
  RuleCreateInput,
  RuleOutput,
  RuleUpdateInput,
  TeamMemberOutput,
} from '@fuku/api/schemas'
import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
  DateRangePicker,
  Item,
  ItemTitle,
} from '@fuku/ui/components'
import { cn } from '@fuku/ui/lib/utils'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Cog, Plus, RefreshCcw, SlidersHorizontal } from 'lucide-react'

import { useTRPC } from '~/trpc/client'
import { RulePopoverButton } from './rule-popover-button'

export const TeamScheduleContent = () => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const params = useParams()
  const slug = params?.slug as string

  const [start, setStart] = useState(new Date())
  const [end, setEnd] = useState(new Date())

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
      start,
      end,
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

  const { mutateAsync: updateRuleCondition } = useMutation({
    ...trpc.ruleCondition.update.mutationOptions(),
    onSuccess: data => {
      queryClient.setQueryData(
        trpc.ruleCondition.groupByRules.queryKey({ teamId: team?.id ?? '' }),
        (oldData: Record<string, RuleConditionOutput[]> | undefined) => {
          if (!oldData) return oldData
          // TODO: optimize
          const ruleConditions = oldData[data.ruleId] ?? []
          const updatedRuleConditions = ruleConditions.map(rc =>
            rc.id === data.id ? data : rc,
          )
          return { ...oldData, [data.ruleId]: updatedRuleConditions }
        },
      )
    },
  })

  const handleMutateRule = async (
    mode: 'create' | 'update' | 'delete',
    rule: RuleCreateInput | RuleUpdateInput | string,
  ): Promise<RuleOutput> => {
    switch (mode) {
      case 'update':
        return await updateRule(rule as RuleUpdateInput)
      case 'create':
        // await createRule(rule as RuleCreateInput)
        return {} as RuleOutput
      case 'delete':
        // await deleteRule(rule.id)
        return {} as RuleOutput
    }
  }

  const handleMutateRuleCondition = async (
    mode: 'create' | 'update' | 'delete',
    ruleCondition: RuleConditionCreateInput | RuleConditionUpdateInput | string,
  ): Promise<RuleConditionOutput> => {
    switch (mode) {
      case 'update':
        return await updateRuleCondition(
          ruleCondition as RuleConditionUpdateInput,
        )

      case 'create':
        // await createRuleCondition(ruleCondition as RuleConditionCreateInput)
        return {} as RuleConditionOutput
      case 'delete':
        // await deleteRuleCondition(ruleCondition.id)
        return {} as RuleConditionOutput
    }
  }

  return (
    <div className='flex flex-col gap-4'>
      <h2>Schedule</h2>
      {/* header */}
      <div className='flex gap-2'>
        <DateRangePicker
          align='start'
          variant='secondary'
          showCompare={false}
          initialDateFrom={start}
          initialDateTo={end}
          onUpdate={({ range }) => {
            setStart(range.from)
            setEnd(range.to || range.from)
          }}
        />
        <RulePopoverButton
          rules={rules ?? {}}
          ruleConditions={ruleConditions ?? {}}
          teamMembers={teamMembers ?? []}
          shiftTypes={shiftTypes ?? []}
          payGrades={payGrades ?? []}
          mutateRule={handleMutateRule}
          mutateRuleCondition={handleMutateRuleCondition}
        />
        <Button className='ml-auto'>
          <RefreshCcw />
          <span className='hidden md:flex'>Auto-Schedule</span>
        </Button>
        <Button variant='secondary'>
          <Cog />
          <span className='hidden md:flex'>Customize</span>
        </Button>
      </div>
      {/* xs breakpoint */}
      <div className='flex sm:hidden'></div>
      {/* sm breakpoint */}
      <div className='hidden sm:flex md:hidden'></div>
      {/* md+ breakpoint */}
      <div className='h-[600px] hidden md:grid grid-flow-col grid-cols-[250px_auto] border rounded-md border-input'>
        <div className='flex flex-col min-h-0 rounded-l-md gap-0 border-r border-input'>
          <Command className='bg-inherit border-none rounded-none p-0'>
            <div className='p-2 border-b border-input flex items-center gap-2'>
              <CommandInput placeholder='Search' className='flex-1' />
              <Button variant='secondary' size='icon'>
                <SlidersHorizontal />
              </Button>
            </div>
            <CommandList className='flex-1 min-h-0 h-full'>
              <CommandEmpty className='p-4 text-sm text-muted-foreground'>
                No team members found.
              </CommandEmpty>
              {teamMembers &&
                teamMembers.map(tm => (
                  <TeamMemberPanelItem key={tm.id} teamMember={tm} />
                ))}
            </CommandList>
          </Command>
          <div className='p-2 border-t border-input'>
            <Button className='w-full' variant='secondary'>
              <Plus /> Add Member
            </Button>
          </div>
        </div>
        <div>calendar</div>
      </div>
      <div className='flex gap-2 justify-end'>
        <Button disabled>
          Save
          <Check />
        </Button>
      </div>
    </div>
  )
}

const TeamMemberPanelItem = ({
  teamMember,
}: {
  teamMember: TeamMemberOutput
}) => {
  return (
    <CommandItem
      value={
        teamMember.givenNames +
        (teamMember.familyName ? ' ' + teamMember.familyName : '')
      }
      noDefaultStyles
      className='not-last:border-b border-input'
    >
      <Collapsible>
        <CollapsibleTrigger className='w-full flex items-center justify-start'>
          <Item className='w-full'>
            <ItemTitle>
              <span>{teamMember.givenNames}</span>
              <span
                className={cn(teamMember.familyName ? 'inline-flex' : 'hidden')}
              >
                {' '}
                {teamMember.familyName}
              </span>
            </ItemTitle>
          </Item>
        </CollapsibleTrigger>
        <CollapsibleContent>{teamMember.payGrade?.name}</CollapsibleContent>
      </Collapsible>
    </CommandItem>
  )
}
