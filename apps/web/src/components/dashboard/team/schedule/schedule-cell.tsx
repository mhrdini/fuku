import { useMemo } from 'react'
import { CollisionPriority } from '@dnd-kit/abstract'
import { useDroppable } from '@dnd-kit/react'
import { ShiftTypeOutput, UnavailabilityOutput } from '@fuku/api/schemas'
import { SchedulerAssignment } from '@fuku/domain/schemas'
import { Button, buttonVariants, Toggle } from '@fuku/ui/components'
import { cn } from '@fuku/ui/lib/utils'
import { Ban, Plus } from 'lucide-react'
import { DateTime } from 'luxon'

import { useScheduleActions } from '~/hooks/schedule/useScheduleActions'
import { CellData, getCellKey, parseCellKey } from '~/lib/schedule'
import { ScheduleAssignmentCard } from './schedule-assignment-card'

interface ScheduleCellProps {
  cellKey: string
  isLastRow: boolean
  isLastCol: boolean
  data: {
    cellData: CellData | undefined
    shiftTypeMap: Map<string, ShiftTypeOutput>
    previewAssignment: SchedulerAssignment | null
  }
  className?: string
}

export const ScheduleCell = ({
  cellKey,
  isLastRow,
  isLastCol,
  data: { cellData, shiftTypeMap, previewAssignment },
  className,
}: ScheduleCellProps) => {
  const { isDropTarget, ref } = useDroppable({
    id: cellKey,
    type: 'cell',
    accept: 'assignment',
    data: {
      cellKey,
    },
    collisionPriority: CollisionPriority.Highest,
  })

  const {
    createAssignmentInCell,
    addUnavailabilityToCell,
    removeUnavailabilityById,
  } = useScheduleActions()

  const assignments = useMemo(
    () => cellData && cellData.schedulerAssignments,
    [cellData?.schedulerAssignments],
  )

  const unavailability = useMemo(() => {
    const { teamMemberId, date } = parseCellKey(cellKey)
    const unavailability = cellData?.schedulerUnavailabilities?.find(
      ua =>
        ua.teamMemberId === teamMemberId &&
        DateTime.fromJSDate(ua.date).hasSame(DateTime.fromJSDate(date), 'day'),
    )
    return unavailability ? (unavailability as UnavailabilityOutput) : null
  }, [cellData?.schedulerUnavailabilities])

  const handleCreateAssignment = () => {
    const getDefaultShiftTypeId = shiftTypeMap.keys().next().value!
    createAssignmentInCell({ cellKey, shiftTypeId: getDefaultShiftTypeId })
  }

  const handleToggleUnavailability = () => {
    if (unavailability) {
      removeUnavailabilityById(unavailability.id)
    } else {
      addUnavailabilityToCell(cellKey)
    }
  }

  const hasAssignments = useMemo(
    () => (cellData && cellData?.schedulerAssignments.length > 0) || false,
    [cellData?.schedulerAssignments],
  )

  const previewAssignmentCellKey = useMemo(
    () =>
      previewAssignment &&
      getCellKey(previewAssignment.teamMemberId, previewAssignment.date),
    [previewAssignment],
  )

  const previewAssignmentShiftType = useMemo(
    () =>
      previewAssignment
        ? (shiftTypeMap.get(previewAssignment.shiftTypeId) ?? null)
        : null,
    [previewAssignment, shiftTypeMap],
  )

  return (
    <div
      ref={ref}
      id={cellKey}
      className={cn(
        'group',
        'border-input p-1',
        !isLastRow && 'border-b',
        !isLastCol && 'border-r',
        'flex flex-col gap-1.5',
        // 'transition-all',
        'hover:bg-muted/50', // desktop hover
        'focus-visible:bg-muted/50', // keyboard focus
        // 'active:bg-muted/70', // mobile tap feedback
        // 'outline-none focus-visible:border-ring focus-visible:ring-ring/50
        // focus-visible:ring-[3px] focus-visible:outline-1
        // focus-visible:-ring-offset-1',
        unavailability && 'hover:bg-transparent *:not-only:not-last:opacity-40',
        isDropTarget && 'bg-muted/50',
        'relative',
        className,
      )}
      // tabIndex={0}
    >
      {/* preview assignment as swap intent */}
      {previewAssignment &&
        previewAssignmentCellKey !== cellKey &&
        previewAssignmentShiftType && (
          <div
            className={cn(
              'absolute left-1 right-1',
              'group/assignment rounded-md py-1 px-2 border border-input bg-muted flex flex-col',
              'border-2 border-dashed border-info-foreground',
            )}
          >
            <div className='font-bold text-sm'>
              {previewAssignmentShiftType.name ?? ''}
            </div>
            <div className='text-xs text-muted-foreground'>
              {previewAssignmentShiftType.startTime ?? ''}
              {previewAssignmentShiftType.endTime
                ? ' - ' + previewAssignmentShiftType.endTime
                : ''}
            </div>
          </div>
        )}
      {/* real assignments */}
      {assignments &&
        assignments.length > 0 &&
        assignments.map(a => {
          return (
            <ScheduleAssignmentCard
              key={a.id}
              cellKey={cellKey}
              assignment={a}
              data={{
                shiftTypeMap,
              }}
            />
          )
        })}
      <div
        className={cn(
          'pointer-events-none opacity-0 md:pointer-events-auto md:flex size-full items-end *:flex-1 *:h-6 transition-opacity text-xs text-muted-foreground group-hover:opacity-100 group-focus-visible:opacity-100',
          'has-[*[data-state=on]]:opacity-100',
          'has-[*[data-state=on]]:[&>*]:hidden',
          'has-[*[data-state=on]]:[&>*[data-state=on]]:flex',
          'has-[*[data-state=on]]:[&>*[data-state=on]]:flex-1',
        )}
      >
        {/* Add assignments, unavailabilities, per cell etc here */}
        <Toggle
          asChild
          className={cn(
            buttonVariants({
              variant: 'error-secondary',
              size: 'icon-chip',
            }),
            // on state
            'data-[state=on]:bg-error data-[state=on]:text-error-foreground',
            // hover state
            'data-[state=on]:hover:bg-error/90',
          )}
          pressed={!!unavailability}
          onPressedChange={handleToggleUnavailability}
        >
          <Button
            variant='error-secondary'
            size='icon-chip'
            className='rounded-r-none data-[state=on]:rounded-md'
          >
            <Ban />
          </Button>
        </Toggle>
        <Button
          disabled={
            !!unavailability ||
            !cellKey ||
            shiftTypeMap.size === 0 ||
            cellData?.schedulerAssignments.length === 1
          }
          variant='success-secondary'
          size='icon-chip'
          className='rounded-l-none'
          onClick={handleCreateAssignment}
        >
          <Plus />
        </Button>
      </div>
    </div>
  )
}
