'use client'

import { DragDropProvider } from '@dnd-kit/react'
import { SchedulerAssignment } from '@fuku/domain/schemas'
import { useTranslation } from '@fuku/i18n/react'
import { Badge, Button, ScrollArea, ScrollBar } from '@fuku/ui/components'
import { cn } from '@fuku/ui/lib/utils'
import { format } from 'date-fns'
import { enGB } from 'date-fns/locale'
import { Plus } from 'lucide-react'

import { useScheduleActions } from '~/hooks/schedule/useScheduleActions'
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
  const { t } = useTranslation()
  const { dayMetricsMap } = useScheduleStore()

  const { moveAssignmentToCell } = useScheduleActions()

  const locale = enGB

  return (
    <DragDropProvider
      onDragEnd={event => {
        const active = event.operation.source
        const over = event.operation.target

        if (!active || !over) return

        const activeCellKey = active.data.cellKey as string
        let overCellKey: string | null = null

        if (over.data?.cellKey) {
          overCellKey = over.data?.cellKey as string
        }

        if (over.type === 'cell') {
          overCellKey = over.id as string
        }

        if (!overCellKey) return

        const activeAssignment = active.data.assignment as SchedulerAssignment
        console.log('moving active to over:', {
          assignmentId: activeAssignment.id,
          toCellKey: overCellKey,
        })

        moveAssignmentToCell({
          assignmentId: activeAssignment.id,
          toCellKey: overCellKey,
        })

        const overCellAssignment = cellMap.get(overCellKey)
          ?.schedulerAssignments[0] as SchedulerAssignment

        if (
          overCellAssignment &&
          overCellAssignment.id !== activeAssignment.id
        ) {
          console.log('moving over to active:', {
            assignmentId: overCellAssignment.id,
            toCellKey: activeCellKey,
          })

          moveAssignmentToCell({
            assignmentId: overCellAssignment.id,
            toCellKey: activeCellKey,
          })
        }
      }}
    >
      <ScrollArea
        className={cn('h-[600px] border rounded-none border-input', className)}
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
                {t('noMembersFound', 'No members found.')}
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
                  data={{
                    shiftTypeMap,
                    cellMap,
                  }}
                />
              )
            })
          )}

          {/* footer row */}
          <div className='sticky left-0 bottom-0 z-30 border-t border-r border-input text-center bg-background p-2'>
            <Button className='w-full' variant='secondary'>
              <Plus /> {t('addMember', 'Add member')}
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
    </DragDropProvider>
  )
}
