'use client'

import { DragDropProvider } from '@dnd-kit/react'
import { useTranslation } from '@fuku/i18n/react'
import { Badge, Button, ScrollArea, ScrollBar } from '@fuku/ui/components'
import { cn } from '@fuku/ui/lib/utils'
import { format } from 'date-fns'
import { PlusIcon } from 'lucide-react'

import type { SchedulerAssignment } from '@fuku/domain/schemas'

import { useScheduleActions } from '~/hooks/schedule/use-schedule-actions'
import type { ScheduleData } from '~/hooks/schedule/use-schedule-data'
import type { ScheduleDerivedData } from '~/hooks/schedule/use-schedule-derived-data'
import type { ScheduleFilters } from '~/hooks/schedule/use-schedule-filters'
import { useTeamMemberGroupBySort } from '~/hooks/schedule/use-team-member-group-by-sort'
import { getDateFnsLocale } from '~/lib/date-fns'
import { useScheduleStore } from '~/store/schedule.store'

import { ScheduleRow } from './schedule-row'
import { ScheduleTeamMemberHeaderCell } from './schedule-team-member-header-cell'

type ScheduleGridProps = {
  data: ScheduleData
  filters: ScheduleFilters
  derivedData: ScheduleDerivedData
  className?: string
}

export function ScheduleGrid({
  data: { payGrades },
  filters: { filteredTeamMembers, ...filters },
  derivedData: { daysRowList, cellMap, shiftTypeMap, payGradeMap },
  className,
}: ScheduleGridProps) {
  const { t, i18n } = useTranslation()

  const locale = getDateFnsLocale(i18n.language)

  const { dayMetricsMap } = useScheduleStore()

  const { moveAssignmentToCell } = useScheduleActions()

  const {
    sortedTeamMembers,
    groupByKey,
    setGroupByKey,
    sortKey,
    setSortKey,
    direction,
    toggleDirection,
    reset,
  } = useTeamMemberGroupBySort(filteredTeamMembers)

  return (
    <DragDropProvider
      onDragEnd={(event) => {
        const active = event.operation.source
        const over = event.operation.target

        if (!active || !over)
          return

        const activeCellKey = active.data.cellKey as string
        let overCellKey: string | null = null

        if (over.data?.cellKey) {
          overCellKey = over.data?.cellKey as string
        }

        if (over.type === 'cell') {
          overCellKey = over.id as string
        }

        if (!overCellKey)
          return

        const activeAssignment = active.data.assignment as SchedulerAssignment
        // console.log('moving active to over:', {
        //   assignmentId: activeAssignment.id,
        //   toCellKey: overCellKey,
        // })

        moveAssignmentToCell({
          assignmentId: activeAssignment.id,
          toCellKey: overCellKey,
        })

        const overCellAssignment = cellMap.get(overCellKey)
          ?.schedulerAssignments[0] as SchedulerAssignment

        if (
          overCellAssignment
          && overCellAssignment.id !== activeAssignment.id
        ) {
          // console.log('moving over to active:', {
          //   assignmentId: overCellAssignment.id,
          //   toCellKey: activeCellKey,
          // })

          moveAssignmentToCell({
            assignmentId: overCellAssignment.id,
            toCellKey: activeCellKey,
          })
        }
      }}
    >
      <ScrollArea
        className={cn('h-[600px] rounded-none border-input border-t', className)}
      >
        <div
          className='isolate grid h-[600px] min-w-max'
          style={{
            gridTemplateColumns: `250px repeat(${daysRowList.length}, minmax(120px, 1fr))`,
            gridTemplateRows:
              sortedTeamMembers.length > 1
                ? `min-content repeat(${sortedTeamMembers.length - 1}, min-content) 1fr min-content`
                : 'min-content 1fr min-content',
          }}
        >
          {/* header row */}
          <ScheduleTeamMemberHeaderCell
            data={{ payGrades }}
            filters={{ filteredTeamMembers, ...filters }}
            derivedData={{ payGradeMap }}
            teamMemberGroupBySort={{
              sortedTeamMembers,
              groupByKey,
              setGroupByKey,
              sortKey,
              setSortKey,
              direction,
              toggleDirection,
              reset,
            }}
          />
          {daysRowList.map(day => (
            <div
              id={day.id}
              key={day.id}
              className='border-input bg-background sticky top-0 z-30 flex items-center gap-1.5 border-b px-4 py-2'
            >
              <span className='font-bold'>
                {format(day.date, 'ccc', { locale })}
              </span>
              <span>{format(day.date, 'd', { locale })}</span>
            </div>
          ))}

          {/* member rows */}
          {sortedTeamMembers.length === 0
            ? (
                <>
                  <div className='text-muted-foreground bg-background border-input sticky left-0 z-20 flex items-start border-r p-4 text-xs'>
                    {t('noMembersFound', 'No members .')}
                  </div>

                  {daysRowList.map(day => (
                    <div
                      id={`no-members-${day.id}`}
                      key={`no-members-${day.id}`}
                      className=''
                    />
                  ))}
                </>
              )
            : (
                sortedTeamMembers.map((tm, idx) => {
                  const isLastRow = idx === sortedTeamMembers.length - 1
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
                      filters={{ filteredTeamMembers, ...filters }}
                    />
                  )
                })
              )}

          {/* footer row */}
          <div className='border-input bg-background sticky bottom-0 left-0 z-30 border-t border-r p-2 text-center'>
            <Button className='w-full' variant='secondary'>
              <PlusIcon />
              {' '}
              {t('addMember', 'Add member')}
            </Button>
          </div>
          {daysRowList.map(day => (
            <div
              id={`day-summary-${day.id}`}
              key={`day-summary-${day.id}`}
              className='border-input bg-background sticky bottom-0 z-10 flex items-center border-t'
            >
              <Badge variant='outline' className='mx-auto'>
                {t('lengthMembersAssigned', '{{length}} assigned', {
                  length:
                    dayMetricsMap.get(day.id)?.totalScheduledTeamMembers ?? 0,
                })}
              </Badge>
            </div>
          ))}
        </div>
        <ScrollBar orientation='horizontal' />
      </ScrollArea>
    </DragDropProvider>
  )
}
