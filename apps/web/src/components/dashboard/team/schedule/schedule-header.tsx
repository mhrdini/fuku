'use client'

import { TeamOutput } from '@fuku/api/schemas'
import {
  Button,
  ButtonGroup,
  ButtonGroupSeparator,
  DateRangePicker,
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
import { enGB } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Cog, RefreshCcw } from 'lucide-react'

import { ScheduleData } from '~/hooks/schedule/useScheduleData'
import { ScheduleDerivedData } from '~/hooks/schedule/useScheduleDerivedData'
import { ScheduleViewState } from '~/hooks/schedule/useScheduleView'
import { ViewOptionValues } from '~/lib/schedule'
import { useScheduleStore } from '~/store/schedule.store'
import { RulePanelPopoverButton } from './rule-panel-popover-button'

type ScheduleHeaderProps = {
  viewState: ScheduleViewState
  data: ScheduleData
  derivedData: ScheduleDerivedData
}

export const ScheduleHeader = ({
  viewState: {
    view,
    start,
    end,
    setView,
    setStart,
    setEnd,
    handlePrevRange,
    handleNextRange,
    handleViewChange,
  },
  data: {
    team,
    rules,
    ruleConditions,
    teamMembers,
    shiftTypes,
    payGrades,
    handleMutateRule,
    handleMutateRuleCondition,
    handleGenerateSchedule,
    isGenerating,
  },
  derivedData: { computeSchedulerMetrics },
}: ScheduleHeaderProps) => {
  const locale = enGB

  const {
    schedulerAssignments,
    schedulerUnavailabilities,
    setSchedulerMetrics,
  } = useScheduleStore()

  return (
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
            const metrics = computeSchedulerMetrics(
              schedulerAssignments,
              schedulerUnavailabilities,
            )
            setSchedulerMetrics(metrics)
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
        <span className={cn('hidden md:flex', isGenerating && 'md:hidden')}>
          Auto-Schedule
        </span>
        <span className={cn('hidden', isGenerating && 'md:flex')}>
          Generating...
        </span>
      </Button>
      <Button variant='secondary'>
        <Cog />
        <span className='hidden md:flex'>Customize</span>
      </Button>
    </div>
  )
}
