'use client'

import { Badge, Button, ScrollArea, ScrollBar } from '@fuku/ui/components'
import { cn } from '@fuku/ui/lib/utils'
import { format } from 'date-fns'
import { enGB } from 'date-fns/locale'
import { Plus } from 'lucide-react'

import { ScheduleData } from '~/hooks/schedule/useScheduleData'
import { ScheduleDerivedData } from '~/hooks/schedule/useScheduleDerivedData'
import { ScheduleFilters } from '~/hooks/schedule/useScheduleFilters'
import { useScheduleStore } from '~/store/schedule.store'
import { ScheduleRow } from './schedule-row'
import { ScheduleTeamMemberHeaderCell } from './schedule-team-member-header-cell'

interface ScheduleGridProps {
  data: ScheduleData
  filters: ScheduleFilters
  derivedData: ScheduleDerivedData
  className?: string
}

export const ScheduleGrid = ({
  data: { payGrades },
  filters: { filteredTeamMembers, ...filters },
  derivedData: { daysRowList, cellMap, shiftTypeMap, payGradeMap },
  className,
}: ScheduleGridProps) => {
  const { dayMetricsMap } = useScheduleStore()

  const locale = enGB

  return (
    <ScrollArea
      className={cn('h-[600px] border rounded-md border-input', className)}
    >
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
        {/* header row */}
        <ScheduleTeamMemberHeaderCell
          data={{ payGrades }}
          filters={{ filteredTeamMembers, ...filters }}
          derivedData={{ payGradeMap }}
        />
        {daysRowList.map(day => (
          <div
            id={day.id}
            key={day.id}
            className='sticky top-0 z-30 border-b border-input flex items-center bg-background py-2 px-4 gap-1.5'
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
              <ScheduleRow
                key={tm.id}
                teamMember={tm}
                isLastRow={isLastRow}
                days={daysRowList}
                data={{ shiftTypeMap, cellMap }}
              />
            )
          })
        )}

        {/* footer row */}
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
  )
}
