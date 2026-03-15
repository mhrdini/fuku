'use client'

import { Fragment, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  RuleConditionCreateInput,
  RuleConditionOutput,
  RuleConditionUpdateInput,
  RuleCreateInput,
  RuleOutput,
  RuleUpdateInput,
  TeamMemberOutput,
  TeamOutput,
} from '@fuku/api/schemas'
import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  DateRangePicker,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  Item,
  ItemTitle,
} from '@fuku/ui/components'
import { cn } from '@fuku/ui/lib/utils'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Check,
  Cog,
  Plus,
  RefreshCcw,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import { DateTime, MonthNumbers } from 'luxon'

import { useTRPC } from '~/trpc/client'
import { RulePanelPopoverButton } from './rule-panel-popover-button'

type ViewOption = 'day' | 'week' | 'month'

const daysByView = (view: ViewOption, month?: number): number => {
  switch (view) {
    case 'day':
      return 1
    case 'week':
      return 7
    case 'month':
      if (!month) {
        const now = DateTime.now()
        month = now.month as MonthNumbers
      }
      return DateTime.local(DateTime.now().year, month).daysInMonth!
  }
}

const widthsByView: Record<ViewOption, string> = {
  day: '1fr',
  week: '1fr',
  month: '120px',
}

export const TeamScheduleContent = () => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const params = useParams()
  const slug = params?.slug as string

  const [view, setView] = useState<ViewOption>('month')

  const [start, setStart] = useState(new Date())
  const [end, setEnd] = useState(new Date())

  const daysArray = useMemo(() => {
    const numDays = daysByView(view)
    return Array.from({ length: numDays }, (_, i) => i + 1)
  }, [view])

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

  const [search, setSearch] = useState('')
  const filteredMembers: TeamMemberOutput[] = useMemo(() => {
    if (!teamMembers) return []
    return teamMembers.filter(tm =>
      tm.givenNames.toLowerCase().includes(search.toLowerCase()),
    )
  }, [teamMembers, search])

  const { mutateAsync: generateSchedule } = useMutation({
    ...trpc.schedule.generateMonthly.mutationOptions(),
    onSuccess: data => {
      console.log(data)
    },
  })

  const handleGenerateSchedule = () => {
    if (!team) return

    const timeZone = 'UTC' // team.timeZone

    const startUTC = DateTime.fromJSDate(start)
      .setZone(timeZone, { keepLocalTime: true })
      .startOf('day')
      .toUTC()

    const endUTC = DateTime.fromJSDate(end)
      .setZone(timeZone, { keepLocalTime: true })
      .endOf('day')
      .toUTC()

    // console.log({
    //   startUTC: startUTC.toFormat("yyyy-MM-dd'T'HH:mm:ss ZZZZ"),
    //   endUTC: endUTC.toFormat("yyyy-MM-dd'T'HH:mm:ss ZZZZ"),
    // })

    generateSchedule({
      teamId: team.id,
      start: startUTC.toJSDate(),
      end: endUTC.toJSDate(),
      timeZone,
    })
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
        <RulePanelPopoverButton
          team={team ?? ({} as TeamOutput)}
          rules={rules ?? {}}
          ruleConditions={ruleConditions ?? {}}
          teamMembers={teamMembers ?? []}
          shiftTypes={shiftTypes ?? []}
          payGrades={payGrades ?? []}
          mutateRule={handleMutateRule}
          mutateRuleCondition={handleMutateRuleCondition}
        />
        <Button className='ml-auto' onClick={handleGenerateSchedule}>
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
      <div className='h-[600px] hidden md:block border rounded-md border-input overflow-auto overscroll-none'>
        <div
          className='grid min-w-max min-h-full'
          style={{
            gridTemplateColumns: `250px repeat(${daysByView(view)}, minmax(120px, 1fr))`,
            gridTemplateRows: `min-content repeat(${filteredMembers.length || 1}, minmax(min-content, 1fr)) min-content`,
          }}
        >
          {/* team member input + filter header */}
          <div className='sticky left-0 top-0 z-20 p-2 border-b border-r border-input bg-background flex items-center gap-2'>
            <InputGroup className='flex-1 bg-input/30'>
              <InputGroupAddon>
                <Search className='size-4 shrink-0 opacity-50' />
              </InputGroupAddon>

              <InputGroupInput
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder='Search'
              />
              <InputGroupAddon
                align='inline-end'
                className={cn(!search && 'hidden')}
              >
                <InputGroupButton
                  size='icon-xs'
                  variant='ghost'
                  onClick={() => setSearch('')}
                >
                  <X />
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>

            <Button variant='secondary' size='icon'>
              <SlidersHorizontal />
            </Button>
          </div>

          {/* day headers */}
          {daysArray.map(day => (
            <div
              key={day}
              className='sticky top-0 z-10 border-b border-r border-input text-center bg-background p-2'
            >
              {day}
            </div>
          ))}

          {/* member rows */}
          {filteredMembers.length === 0 ? (
            <>
              <div className='sticky left-0 p-4 flex items-start text-sm text-muted-foreground bg-background border-r border-input'>
                No members found.
              </div>

              {daysArray.map(day => (
                <div key={`empty-${day}`} className='' />
              ))}
            </>
          ) : (
            filteredMembers.map((tm, idx) => {
              const isLastRow = idx === filteredMembers.length - 1
              return (
                <Fragment key={tm.id}>
                  {/* member cell */}
                  <div
                    className={cn(
                      'sticky left-0 z-10 w-[250px] bg-background border-r border-input p-2',
                      !isLastRow && 'border-b',
                    )}
                  >
                    <TeamMemberPanelItem teamMember={tm} />
                  </div>

                  {/* shift cells */}
                  {daysArray.map((day, idx) => {
                    const isLastCol = idx === daysArray.length - 1
                    return (
                      <div
                        key={`${tm.id}-${day}`}
                        className={cn(
                          'border-input p-1',
                          !isLastRow && 'border-b',
                          !isLastCol && 'border-r',
                        )}
                      >
                        {tm.givenNames} {day}
                      </div>
                    )
                  })}
                </Fragment>
              )
            })
          )}

          {/* add member button */}
          <div className='sticky left-0 bottom-0 z-10 border-t border-r border-input text-center bg-background p-2'>
            <Button className='w-full' variant='secondary'>
              <Plus /> Add member
            </Button>
          </div>
          {daysArray.map(day => (
            <div
              key={`empty-${day}`}
              className='sticky bottom-0 z-10 border-t border-input text-center bg-background p-2'
            />
          ))}
        </div>
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
    <div className='not-last:border-b border-input'>
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
    </div>
  )
}
