'use client'

import { useMemo } from 'react'

import i18next from '@fuku/i18n/client'
import { Trans, useTranslation } from '@fuku/i18n/react'
import {
  Badge,
  Button,
  ButtonGroup,
  ButtonGroupSeparator,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  DateRangePicker,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  ScrollArea,
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
import { enGB, ja } from 'date-fns/locale'
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  DownloadIcon,
  EyeIcon,
  RefreshCcwIcon,
} from 'lucide-react'
import { DateTime } from 'luxon'

import type { TeamOutput } from '@fuku/api/schemas'

import type { ScheduleData } from '~/hooks/schedule/use-schedule-data'
import type { ScheduleDerivedData } from '~/hooks/schedule/use-schedule-derived-data'
import type { ScheduleFilters } from '~/hooks/schedule/use-schedule-filters'
import type { ScheduleMutations } from '~/hooks/schedule/use-schedule-mutations'
import type { ScheduleViewState } from '~/hooks/schedule/use-schedule-view'
import { convertToCSV } from '~/lib/csv'
import { getByIdMap } from '~/lib/db'
import { convertToPDF } from '~/lib/pdf'
import { ViewOptionValues } from '~/lib/schedule'
import { useScheduleStore } from '~/store/schedule.store'

import RulePanelPopoverButton from './rule-panel/rule-panel-popover-button'

type ScheduleHeaderProps = {
  viewState: ScheduleViewState
  data: ScheduleData
  filters: ScheduleFilters
  mutations: ScheduleMutations
  derivedData: ScheduleDerivedData
}

export function ScheduleHeader({
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
  filters: { toggleShiftType, filteredShiftTypes, resetFilteredShiftTypes },
  mutations: {
    handleMutateRule,
    handleMutateRuleCondition,
    handleGenerateSchedule,
    isGenerating,
  },
  derivedData: { computeSchedulerMetrics },
}: ScheduleHeaderProps) {
  const { t } = useTranslation()

  const locale = useMemo(
    () => (i18next.language === 'en' ? enGB : ja),
    [i18next.language],
  )

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
          <ChevronLeftIcon />
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
            if (view)
              setView(view)
            const metrics = computeSchedulerMetrics(
              schedulerAssignments,
              schedulerUnavailabilities,
            )
            setSchedulerMetrics(metrics)
          }}
        />
        <ButtonGroupSeparator />
        <Button variant='secondary' size='icon' onClick={handleNextRange}>
          <ChevronRightIcon />
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
              <SelectItem id={option} key={option} value={option}>
                {t(option, option)}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='secondary' size='icon'>
            <EyeIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>{t('showOnly')}</DropdownMenuLabel>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <ClockIcon />
              {t('shiftType', 'Shift Type')}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <Command>
                <CommandInput placeholder={t('searchPayGrade')} />
                <CommandList>
                  <ScrollArea
                  // className='max-h-48'
                  >
                    <CommandEmpty className='text-muted-foreground p-4 text-xs'>
                      {t('noShiftTypesFound')}
                    </CommandEmpty>
                    <CommandGroup>
                      {shiftTypes?.map(st => (
                        <CommandItem
                          key={st.id}
                          value={st.id}
                          onSelect={() => toggleShiftType(st.id)}
                        >
                          <Badge variant='outline'>{st.name}</Badge>
                          {filteredShiftTypes.has(st.id) && (
                            <CheckIcon size={16} className='ml-auto' />
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </ScrollArea>
                </CommandList>
                <CommandSeparator />
                <Button
                  onClick={resetFilteredShiftTypes}
                  variant='ghost'
                  className='text-muted-foreground'
                >
                  {t('clearAll')}
                </Button>
              </Command>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button
        className='ml-auto'
        onClick={handleGenerateSchedule}
        disabled={isGenerating}
      >
        {isGenerating ? <Spinner /> : <RefreshCcwIcon />}
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
            <DownloadIcon />
            <ChevronDownIcon className='text-muted-foreground' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuItem
            className='block cursor-pointer whitespace-nowrap'
            onClick={downloadCSV}
          >
            <Trans i18nKey='downloadAsCSV'>
              Download as
              {' '}
              <span className='font-bold'>CSV</span>
            </Trans>
          </DropdownMenuItem>
          <DropdownMenuItem
            className='block cursor-pointer whitespace-nowrap'
            onClick={downloadPDF}
          >
            <Trans i18nKey='downloadAsPDF'>
              Download as
              {' '}
              <span className='font-bold'>PDF</span>
            </Trans>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
