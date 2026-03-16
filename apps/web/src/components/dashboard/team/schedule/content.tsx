'use client'

import { Fragment, useEffect, useId, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  GenerateScheduleOutput,
  PayGradeOutput,
  RuleConditionCreateInput,
  RuleConditionOutput,
  RuleConditionUpdateInput,
  RuleCreateInput,
  RuleOutput,
  RuleUpdateInput,
  SchedulerAssignment,
  SchedulerAssignmentSchema,
  ShiftTypeOutput,
  TeamMemberOutput,
  TeamOutput,
} from '@fuku/api/schemas'
import {
  Badge,
  Button,
  ButtonGroup,
  ButtonGroupSeparator,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  DateRangePicker,
  Field,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ScrollArea,
  ScrollBar,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  Spinner,
} from '@fuku/ui/components'
import { cn } from '@fuku/ui/lib/utils'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Cog,
  Plus,
  RefreshCcw,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import { DateTime } from 'luxon'
import * as z from 'zod/v4'

import { I18nLocaleCode, locales } from '~/lib/i18n'
import {
  CellData,
  Day,
  DayMetrics,
  defaultDateRangesByView,
  getDefaultDateRangeByView,
  getInitialCellData,
  SchedulerMetrics,
  TeamMemberData,
  TeamMemberMetrics,
  ViewOption,
  ViewOptionValues,
} from '~/lib/schedule'
import { useScheduleStore } from '~/store/schedule.store'
import { useTRPC } from '~/trpc/client'
import { RulePanelPopoverButton } from './rule-panel-popover-button'

export const TeamScheduleContent = () => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const params = useParams()
  const slug = params?.slug as string

  // Date range and view state

  const [view, setView] = useState<ViewOption>('month')
  const [start, setStart] = useState(defaultDateRangesByView[view].from)
  const [end, setEnd] = useState(defaultDateRangesByView[view].to)

  const localeCode: I18nLocaleCode = 'enGB' // TODO: add as part of user settings
  const locale = locales[localeCode]

  const handleViewChange = (view: ViewOption) => {
    setView(view)
    const { from, to } = getDefaultDateRangeByView(view, start)
    setStart(from)
    setEnd(to)
  }

  const handleNextRange = () => {
    switch (view) {
      case 'day': {
        const nextDay = DateTime.fromJSDate(start).plus({ days: 1 })
        setStart(nextDay.startOf('day').toJSDate())
        setEnd(nextDay.endOf('day').toJSDate())
        break
      }
      case 'week': {
        const nextWeek = DateTime.fromJSDate(start).plus({ days: 7 })
        const nextWeekEnd = nextWeek.plus({ days: 6 })
        setStart(nextWeek.startOf('day').toJSDate())
        setEnd(nextWeekEnd.endOf('day').toJSDate())
        break
      }
      case 'month': {
        const nextMonth = DateTime.fromJSDate(start).plus({ months: 1 })
        setStart(nextMonth.startOf('month').toJSDate())
        setEnd(nextMonth.endOf('month').toJSDate())
        break
      }
    }
  }

  const handlePrevRange = () => {
    switch (view) {
      case 'day': {
        const prevDay = DateTime.fromJSDate(start).minus({ days: 1 })
        setStart(prevDay.startOf('day').toJSDate())
        setEnd(prevDay.endOf('day').toJSDate())
        break
      }
      case 'week': {
        const prevWeek = DateTime.fromJSDate(start).minus({ days: 7 })
        const prevWeekEnd = prevWeek.plus({ days: 6 })
        setStart(prevWeek.startOf('day').toJSDate())
        setEnd(prevWeekEnd.endOf('day').toJSDate())
        break
      }
      case 'month': {
        const prevMonth = DateTime.fromJSDate(start).minus({ months: 1 })
        setStart(prevMonth.startOf('month').toJSDate())
        setEnd(prevMonth.endOf('month').toJSDate())
        break
      }
    }
  }

  // Day and cell utils

  const getDayId = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date
    return DateTime.fromJSDate(d).toFormat('yyyy-MM-dd')
  }

  const getCellKey = (teamMemberId: string, date: Date) =>
    `${teamMemberId}-${getDayId(date)}`

  const daysRowList = useMemo<Day[]>(() => {
    const startDT = DateTime.fromJSDate(start).startOf('day')
    const endDT = DateTime.fromJSDate(end).endOf('day')

    const days: Day[] = []
    let current = startDT

    while (current <= endDT) {
      days.push({
        id: getDayId(current.toJSDate()),
        date: current.toJSDate(),
      })

      current = current.plus({ days: 1 })
    }

    return days
  }, [start, end])

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

  // Lookup maps for API-fetched data

  const teamMemberMap = useMemo(() => {
    if (!teamMembers) return new Map<string, TeamMemberData>()
    const map = new Map<string, TeamMemberData>()
    for (const tm of teamMembers) {
      const teamMemberData = {
        ...tm,
        totalAssignedShifts: 0,
        totalHours: 0,
      }
      map.set(tm.id, teamMemberData)
    }
    return map
  }, [teamMembers])

  const shiftTypeMap = useMemo(() => {
    if (!shiftTypes) return new Map<string, ShiftTypeOutput>()
    const map = new Map<string, ShiftTypeOutput>()
    for (const st of shiftTypes) {
      map.set(st.id, st)
    }
    return map
  }, [shiftTypes])

  const payGradeMap = useMemo(() => {
    if (!payGrades) return new Map<string, PayGradeOutput>()
    const map = new Map<string, PayGradeOutput>()
    for (const pg of payGrades) {
      map.set(pg.id, pg)
    }
    return map
  }, [payGrades])

  // Scheduler assignments and metrics state and logic

  const {
    schedulerAssignments,
    setSchedulerAssignments,
    teamMemberMetricsMap,
    dayMetricsMap,
    setSchedulerMetrics,
  } = useScheduleStore()

  const computeShiftDurationHours = (shiftTypeId: string) => {
    const shiftType = shiftTypeMap.get(shiftTypeId)

    if (!shiftType) {
      return 0
    }

    const shiftStart = DateTime.fromFormat(shiftType.startTime, 'HH:mm')
    const shiftEnd = DateTime.fromFormat(shiftType.endTime, 'HH:mm')
    return shiftEnd.diff(shiftStart, 'hours').hours
  }

  const computeSchedulerMetrics = (
    assignments: SchedulerAssignment[],
  ): SchedulerMetrics => {
    const teamMemberMetricsMap = new Map<string, TeamMemberMetrics>()
    const dayMetricsMap = new Map<string, DayMetrics>()

    assignments = z.array(SchedulerAssignmentSchema).parse(assignments)

    for (const assignment of assignments) {
      const shiftDurationHours = computeShiftDurationHours(
        assignment.shiftTypeId,
      )

      const teamMemberId = assignment.teamMemberId
      const dayId = getDayId(assignment.date)

      const currentMemberMetrics = teamMemberMetricsMap.get(teamMemberId) ?? {
        totalAssignedShifts: 0,
        totalHours: 0,
      }

      const currentDayMetrics = dayMetricsMap.get(dayId) ?? {
        totalScheduledTeamMembers: 0,
      }

      teamMemberMetricsMap.set(teamMemberId, {
        totalAssignedShifts: currentMemberMetrics.totalAssignedShifts + 1,
        totalHours: currentMemberMetrics.totalHours + shiftDurationHours,
      })

      dayMetricsMap.set(dayId, {
        totalScheduledTeamMembers:
          // because scheduler can only create 1 assignment
          // per team member per day, we can just increment by 1
          currentDayMetrics.totalScheduledTeamMembers + 1,
      })
    }

    return { teamMemberMetricsMap, dayMetricsMap }
  }

  useEffect(() => {
    if (schedulerAssignments.length > 0 && shiftTypeMap.size > 0) {
      console.log('scheduler assignments changed:', schedulerAssignments)
      const metrics = computeSchedulerMetrics(schedulerAssignments)
      console.log('computed metrics:', metrics)
      setSchedulerMetrics(metrics)
    }
  }, [schedulerAssignments, shiftTypeMap])

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

    const timeZone = 'UTC' // team.timeZone

    const startUTC = DateTime.fromJSDate(start)
      .setZone(timeZone, { keepLocalTime: true })
      .startOf('day')
      .toUTC()

    const endUTC = DateTime.fromJSDate(end)
      .setZone(timeZone, { keepLocalTime: true })
      .endOf('day')
      .toUTC()

    generateSchedule({
      teamId: team.id,
      start: startUTC.toJSDate(),
      end: endUTC.toJSDate(),
      timeZone,
    })
  }

  // Team member search and filter

  const [filteredPayGrades, setFilteredPayGrades] = useState<string[]>([])
  const payGradeFilterId = useId()
  const togglePayGrade = (value: string) => {
    setFilteredPayGrades(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value],
    )
  }
  const removePayGrade = (value: string) => {
    setFilteredPayGrades(prev => prev.filter(v => v !== value))
  }

  const [search, setSearch] = useState('')

  const filteredTeamMembers: TeamMemberData[] = useMemo(() => {
    if (!teamMembers) return []
    let filtered = teamMembers
      .map(tm => ({
        ...tm,
        ...(teamMemberMetricsMap?.get(tm.id) || {
          totalAssignedShifts: 0,
          totalHours: 0,
        }),
      }))
      .filter(tm => tm.givenNames.toLowerCase().includes(search.toLowerCase()))

    if (filteredPayGrades.length > 0) {
      const filteredPayGradeIds = new Set(filteredPayGrades)
      filtered = filtered.filter(
        (tm: TeamMemberOutput) =>
          tm.payGradeId && filteredPayGradeIds.has(tm.payGradeId),
      )
    }

    return filtered
  }, [teamMembers, search, teamMemberMetricsMap, filteredPayGrades])

  const cellMap = useMemo(() => {
    const map = new Map<string, CellData>()

    const ensure = (cellKey: string) => {
      if (!map.has(cellKey)) {
        map.set(cellKey, getInitialCellData())
      }
      return map.get(cellKey)!
    }

    for (const a of schedulerAssignments) {
      const cellKey = getCellKey(a.teamMemberId, a.date)
      ensure(cellKey).schedulerAssignments.push(a)
    }

    return map
  }, [schedulerAssignments])

  return (
    <div className='flex flex-col gap-4 **:overscroll-none'>
      <h2>Schedule</h2>
      {/* header */}
      <div className='flex gap-2'>
        <ButtonGroup>
          <Button variant='secondary' size='icon' onClick={handlePrevRange}>
            <ChevronLeft />
          </Button>
          <ButtonGroupSeparator />
          <DateRangePicker
            align='start'
            variant='secondary'
            showCompare={false}
            initialDateFrom={start}
            initialDateTo={end}
            value={{ from: start, to: end }}
            view={view}
            locale={locale}
            onUpdate={({ range, view }) => {
              setStart(range.from)
              setEnd(range.to || range.from)
              if (view) setView(view)
            }}
          />
          <ButtonGroupSeparator />
          <Button variant='secondary' size='icon' onClick={handleNextRange}>
            <ChevronRight />
          </Button>
        </ButtonGroup>
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
        <Select value={view} onValueChange={handleViewChange}>
          <SelectTrigger variant='secondary'>
            <span className='flex gap-1'>
              View by
              <span className='capitalize'>
                <SelectValue />
              </span>
            </span>
          </SelectTrigger>
          <SelectContent align='start' position='popper'>
            <SelectGroup>
              <SelectLabel>View by</SelectLabel>
              {ViewOptionValues.map(option => (
                <SelectItem
                  id={option}
                  key={option}
                  value={option}
                  className='capitalize'
                >
                  {option}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Button
          className='ml-auto'
          onClick={handleGenerateSchedule}
          disabled={isGenerating}
        >
          {isGenerating ? <Spinner /> : <RefreshCcw />}
          <span className={cn('hidden md:flex', isGenerating && 'hidden')}>
            Auto-Schedule
          </span>
          <span
            className={cn(
              isGenerating && 'hidden md:flex',
              !isGenerating && 'hidden',
            )}
          >
            Generating...
          </span>
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
      <ScrollArea className='h-[600px] hidden md:block border rounded-md border-input'>
        <div
          className='grid min-w-max h-[600px] isolate'
          style={{
            gridTemplateColumns: `250px repeat(${daysRowList.length}, minmax(120px, 1fr))`,
            gridTemplateRows:
              filteredTeamMembers.length > 1
                ? `min-content repeat(${filteredTeamMembers.length - 1}, min-content) 1fr min-content`
                : 'min-content 1fr min-content',
          }}
        >
          {/* team member input + filter header */}
          <div className='sticky left-0 top-0 z-40 p-2 border-b border-r border-input bg-background flex items-center gap-2'>
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

            {/* filter/sort panel popover */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant='secondary' size='icon'>
                  <SlidersHorizontal />
                </Button>
              </PopoverTrigger>
              <PopoverContent side='right' align='start'>
                <FieldGroup>
                  <FieldSet className='gap-3'>
                    <FieldLegend>Filter</FieldLegend>
                    <Field>
                      <FieldLabel>By Pay Grade</FieldLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            id={payGradeFilterId}
                            variant='outline'
                            role='combobox'
                            className='h-auto min-h-8 w-full justify-between hover:bg-transparent'
                          >
                            <div className='flex flex-wrap items-center gap-1 pr-2.5'>
                              {filteredPayGrades.length > 0 ? (
                                filteredPayGrades.map(id => {
                                  const pg = payGradeMap.get(id)

                                  return pg ? (
                                    <Badge
                                      key={id}
                                      variant='outline'
                                      className='rounded-sm'
                                    >
                                      {pg.name}
                                      <Button
                                        variant='ghost'
                                        size='icon'
                                        className='size-4'
                                        onClick={e => {
                                          e.stopPropagation()
                                          removePayGrade(id)
                                        }}
                                        asChild
                                      >
                                        <span>
                                          <X className='size-3' />
                                        </span>
                                      </Button>
                                    </Badge>
                                  ) : null
                                })
                              ) : (
                                <span className='text-muted-foreground'>
                                  Select pay grades
                                </span>
                              )}
                            </div>
                            <ChevronsUpDown
                              className='text-muted-foreground/80 shrink-0'
                              aria-hidden='true'
                            />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className='w-(--radix-popper-anchor-width) p-0'>
                          <Command>
                            <CommandInput placeholder='Search pay grade...' />
                            <CommandList>
                              <CommandEmpty>No pay grade found.</CommandEmpty>
                              <CommandGroup>
                                {payGrades?.map(pg => (
                                  <CommandItem
                                    key={pg.id}
                                    value={pg.id}
                                    onSelect={() => togglePayGrade(pg.id)}
                                  >
                                    <span className='truncate'>{pg.name}</span>
                                    {filteredPayGrades.includes(pg.id) && (
                                      <Check size={16} className='ml-auto' />
                                    )}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </Field>
                  </FieldSet>
                </FieldGroup>
              </PopoverContent>
            </Popover>
          </div>

          {/* day headers */}
          {daysRowList.map(day => (
            <div
              id={day.id}
              key={day.id}
              className='sticky top-0 z-30 border-b border-r border-input flex items-center bg-background py-2 px-4 gap-1.5'
            >
              <span className='font-bold'>
                {format(day.date, 'ccc', { locale })}
              </span>
              <span>{format(day.date, 'd', { locale })}</span>
            </div>
          ))}

          {/* member rows */}
          {filteredTeamMembers.length === 0 ? (
            <>
              <div className='sticky left-0 z-20 p-4 flex items-start text-sm text-muted-foreground bg-background border-r border-input'>
                No members found.
              </div>

              {daysRowList.map(day => (
                <div
                  id={`no-members-${day.id}`}
                  key={`no-members-${day.id}`}
                  className=''
                />
              ))}
            </>
          ) : (
            filteredTeamMembers.map((tm, idx) => {
              const isLastRow = idx === filteredTeamMembers.length - 1
              return (
                <Fragment key={tm.id}>
                  {/* member cell */}
                  <div
                    className={cn(
                      'sticky left-0 z-20 w-[250px] bg-background border-r border-input',
                      !isLastRow && 'border-b',
                    )}
                  >
                    <TeamMemberPanelItem teamMember={tm} />
                  </div>

                  {/* shift cells */}
                  {daysRowList.map((day, idx) => {
                    const cellKey = getCellKey(tm.id, day.date)
                    const cellData = cellMap.get(cellKey)
                    const isLastCol = idx === daysRowList.length - 1
                    return (
                      <div
                        id={cellKey}
                        key={cellKey}
                        className={cn(
                          'border-input p-1',
                          !isLastRow && 'border-b',
                          !isLastCol && 'border-r',
                          'gap-1.5',
                        )}
                      >
                        {/* Add assignments, unavailabilities, etc here */}
                        {cellData?.schedulerAssignments.map(a => {
                          const shiftType = shiftTypeMap?.get(a.shiftTypeId)
                          if (!shiftType) return null
                          return (
                            <div
                              id={cellKey + '-' + a.shiftTypeId}
                              key={cellKey + '-' + a.shiftTypeId}
                              className='rounded-md py-1 px-2 border border-input bg-muted flex flex-col'
                            >
                              <div className='font-bold text-sm'>
                                {shiftType?.name ?? ''}
                              </div>
                              <div className='text-xs text-muted-foreground'>
                                {shiftType?.startTime ?? ''}
                                {shiftType?.endTime
                                  ? ' - ' + shiftType.endTime
                                  : ''}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                </Fragment>
              )
            })
          )}

          {/* add member button */}
          <div className='sticky left-0 bottom-0 z-30 border-t border-r border-input text-center bg-background p-2'>
            <Button className='w-full' variant='secondary'>
              <Plus /> Add member
            </Button>
          </div>
          {daysRowList.map(day => (
            <div
              id={`day-summary-${day.id}`}
              key={`day-summary-${day.id}`}
              className='sticky bottom-0 z-10 border-t border-input flex items-center bg-background'
            >
              <Badge variant='outline' className='mx-auto'>
                {dayMetricsMap.get(day.id)?.totalScheduledTeamMembers ?? 0}{' '}
                assigned
              </Badge>
            </div>
          ))}
        </div>
        <ScrollBar orientation='horizontal' />
      </ScrollArea>
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
  teamMember: TeamMemberData
}) => {
  return (
    <Collapsible className='group/panel not-last:border-b border-input'>
      <CollapsibleTrigger className='w-full flex items-center min-h-16 px-2'>
        <Item className='size-full py-0 px-2'>
          <ItemContent className='items-start'>
            <ItemTitle>
              <span>{teamMember.givenNames}</span>
              <span
                className={cn(teamMember.familyName ? 'inline-flex' : 'hidden')}
              >
                {' '}
                {teamMember.familyName}
              </span>
            </ItemTitle>
            <ItemDescription className='group-data-[state=open]/panel:hidden'>
              {teamMember.totalAssignedShifts} shifts, {teamMember.totalHours}{' '}
              hours
            </ItemDescription>
          </ItemContent>
        </Item>
      </CollapsibleTrigger>
      <CollapsibleContent className='px-2 pb-2'>
        <div className='*:text-sm **:py-0.5 grid grid-cols-[auto_1fr] gap-2 items-start justify-items-start-safe'>
          <Badge variant='outline'>Pay Grade</Badge>
          <div>{teamMember.payGrade?.name}</div>
          <Badge variant='outline'>Shift Hours</Badge>
          <div className='grid grid-flow-row'>
            <div>{teamMember.totalHours} hours</div>
            <div>
              {teamMember.totalHours *
                (teamMember.payGrade ? teamMember.payGrade.baseRate : 0)}
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
