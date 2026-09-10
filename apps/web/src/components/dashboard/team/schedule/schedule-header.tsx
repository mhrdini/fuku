'use client'

import { useMemo } from 'react'
import { TeamOutput } from '@fuku/api/schemas'
import { Trans, useTranslation } from '@fuku/i18n/react'
import {
  Button,
  ButtonGroup,
  ButtonGroupSeparator,
  DateRangePicker,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  RefreshCcw,
} from 'lucide-react'
import { DateTime } from 'luxon'

import { ScheduleData } from '~/hooks/schedule/useScheduleData'
import { ScheduleDerivedData } from '~/hooks/schedule/useScheduleDerivedData'
import { ScheduleMutations } from '~/hooks/schedule/useScheduleMutations'
import { ScheduleViewState } from '~/hooks/schedule/useScheduleView'
import { convertToCSV } from '~/lib/csv'
import { getByIdMap } from '~/lib/db'
import { convertToPDF } from '~/lib/pdf'
import { ViewOptionValues } from '~/lib/schedule'
import { useScheduleStore } from '~/store/schedule.store'
import { RulePanelPopoverButton } from './rule-panel-popover-button'

type ScheduleHeaderProps = {
  viewState: ScheduleViewState
  data: ScheduleData
  mutations: ScheduleMutations
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
  data: { team, rules, ruleConditions, teamMembers, shiftTypes, payGrades },
  mutations: {
    handleMutateRule,
    handleMutateRuleCondition,
    handleGenerateSchedule,
    isGenerating,
  },
  derivedData: { computeSchedulerMetrics },
}: ScheduleHeaderProps) => {
  const { t } = useTranslation()

  const locale = enGB

  const {
    schedulerAssignments,
    schedulerUnavailabilities,
    setSchedulerMetrics,
  } = useScheduleStore()

  const teamMemberByIdMap = useMemo(
    () => getByIdMap(teamMembers ?? []),
    [teamMembers],
  )
  const shiftTypeByIdMap = useMemo(
    () => getByIdMap(shiftTypes ?? []),
    [shiftTypes],
  )

  const downloadCSV = () => {
    const csv = convertToCSV(
      schedulerAssignments,
      teamMemberByIdMap,
      shiftTypeByIdMap,
      start,
      end,
    )

    const startStr = DateTime.fromJSDate(start).toFormat('yyyy-MM-dd')
    const endStr = DateTime.fromJSDate(end).toFormat('yyyy-MM-dd')
    const fileName = t('startstr__endstrcsv', '{{startStr}}__{{endStr}}.csv', {
      startStr,
      endStr,
    })

    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;',
    })

    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = fileName

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)
  }

  const downloadPDF = async () => {
    const pdf = await convertToPDF(
      schedulerAssignments,
      teamMemberByIdMap,
      shiftTypeByIdMap,
      start,
      end,
    )

    const startStr = DateTime.fromJSDate(start).toFormat('yyyy-MM-dd')
    const endStr = DateTime.fromJSDate(end).toFormat('yyyy-MM-dd')
    const fileName = t('startstr__endstrpdf', '{{startStr}}__{{endStr}}.pdf', {
      startStr,
      endStr,
    })

    pdf.save(fileName)
  }

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
            {t('viewBy', 'View by')}
            <span className='capitalize'>
              <SelectValue />
            </span>
          </span>
        </SelectTrigger>
        <SelectContent align='start' position='popper'>
          <SelectGroup>
            <SelectLabel>{t('viewBy', 'View by')}</SelectLabel>
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
          {t('autoschedule', 'Auto-Schedule')}
        </span>
        <span className={cn('hidden', isGenerating && 'md:flex')}>
          Generating...
        </span>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='secondary'>
            <Download />
            <ChevronDown className='text-muted-foreground' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuItem
            className='block whitespace-nowrap cursor-pointer'
            onClick={downloadCSV}
          >
            <Trans i18nKey='downloadAsCSV'>
              Download as <span className='font-bold'>CSV</span>
            </Trans>
          </DropdownMenuItem>
          <DropdownMenuItem
            className='block whitespace-nowrap cursor-pointer'
            onClick={downloadPDF}
          >
            <Trans i18nKey='downloadAsPDF'>
              Download as <span className='font-bold'>PDF</span>
            </Trans>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
