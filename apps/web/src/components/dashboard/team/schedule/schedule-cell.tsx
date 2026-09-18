import { useMemo } from 'react'

import { CollisionPriority } from '@dnd-kit/abstract'
import { useDroppable } from '@dnd-kit/react'
import { useTranslation } from '@fuku/i18n/react'
import { Button, buttonVariants, Toggle } from '@fuku/ui/components'
import { cn } from '@fuku/ui/lib/utils'
import { BanIcon, PlusIcon } from 'lucide-react'
import { DateTime } from 'luxon'

import type { ShiftTypeOutput, UnavailabilityOutput } from '@fuku/api/schemas'
import type { SchedulerAssignment } from '@fuku/domain/schemas'

import { useScheduleActions } from '~/hooks/schedule/use-schedule-actions'
import type { ScheduleFilters } from '~/hooks/schedule/use-schedule-filters'
import type { CellData } from '~/lib/schedule'
import { getCellKey, parseCellKey } from '~/lib/schedule'

import { ScheduleAssignmentCard } from './schedule-assignment-card'

type ScheduleCellProps = {
  cellKey: string
  isLastRow: boolean
  isLastCol: boolean
  data: {
    eligibleShifts: Map<string, ShiftTypeOutput>
    cellData: CellData | undefined
    shiftTypeMap: Map<string, ShiftTypeOutput>
    previewAssignment: SchedulerAssignment | null
  }
  filters: { filteredShiftTypes: ScheduleFilters['filteredShiftTypes'] }
  className?: string
}

export function ScheduleCell({
  cellKey,
  isLastRow,
  isLastCol,
  data: { eligibleShifts, cellData, shiftTypeMap, previewAssignment },
  filters: { filteredShiftTypes },
  className,
}: ScheduleCellProps) {
  const { t } = useTranslation()
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
        ua.teamMemberId === teamMemberId
        && DateTime.fromJSDate(ua.date).hasSame(DateTime.fromJSDate(date), 'day'),
    )
    return unavailability ? (unavailability as UnavailabilityOutput) : null
  }, [cellData?.schedulerUnavailabilities])

  const handleCreateAssignment = () => {
    const getDefaultShiftTypeId = eligibleShifts.keys().next().value!
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
      previewAssignment
      && getCellKey(previewAssignment.teamMemberId, previewAssignment.date),
    [previewAssignment],
  )

  const previewAssignmentShiftType = useMemo(
    () =>
      previewAssignment
        ? (eligibleShifts.get(previewAssignment.shiftTypeId) ?? null)
        : null,
    [previewAssignment, eligibleShifts],
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
        'flex flex-col gap-1',
        // 'transition-all',
        'hover:bg-muted/50', // desktop hover
        'focus-visible:bg-muted/50', // keyboard focus
        // 'active:bg-muted/70', // mobile tap feedback
        // 'outline-none focus-visible:border-ring focus-visible:ring-ring/50
        // focus-visible:ring-[3px] focus-visible:outline-1
        // focus-visible:-ring-offset-1',
        unavailability && '*:not-only:not-last:opacity-40 hover:bg-transparent',
        isDropTarget && 'bg-muted/50',
        'relative',
        className,
      )}
      // tabIndex={0}
    >
      {/* preview assignment as swap intent */}
      {previewAssignment
        && previewAssignmentCellKey !== cellKey
        && previewAssignmentShiftType && (
        <div
          className={cn(
            'absolute right-1 left-1',
            'group/assignment border-input bg-muted flex flex-col rounded-none border px-2 py-1',
            'border-info-foreground border-2 border-dashed',
          )}
        >
          <div className='text-sm font-bold'>
            {previewAssignmentShiftType.name ?? ''}
          </div>
          <div className='text-muted-foreground text-xs'>
            {previewAssignmentShiftType.startTime ?? ''}
            {previewAssignmentShiftType.endTime
              ? t('key', ' - ') + previewAssignmentShiftType.endTime
              : ''}
          </div>
        </div>
      )}
      {/* real assignments */}
      {assignments
        && assignments.length > 0
        && assignments.map((a) => {
          return filteredShiftTypes.size === 0
            || (filteredShiftTypes.size > 0
              && filteredShiftTypes.has(a.shiftTypeId))
            ? (
                <ScheduleAssignmentCard
                  key={a.id}
                  cellKey={cellKey}
                  assignment={a}
                  data={{
                    eligibleShifts,
                    shiftTypeMap,
                  }}
                />
              )
            : null
        })}
      <div
        className={cn(
          'text-muted-foreground pointer-events-none size-full  items-center justify-end text-xs opacity-0 transition-opacity *:w-full group-hover:opacity-100 group-focus-visible:opacity-100 md:pointer-events-auto md:flex md:flex-col md:gap-1',
          'has-[*[data-state=on]]:opacity-100',
          'has-[*[data-state=on]]:[&>*]:hidden',
          'has-[*[data-state=on]]:[&>*[data-state=on]]:flex',
          'has-[*[data-state=on]]:[&>*[data-state=on]]:flex-1',
        )}
      >
        {/* Add assignments, unavailabilities, per cell etc here */}
        <Button
          hidden={assignments && assignments.length > 0}
          disabled={
            !!unavailability
            || !cellKey
            || eligibleShifts.size === 0
            || cellData?.schedulerAssignments.length === 1
          }
          variant='success-secondary'
          size='icon-chip'
          className={cn(
            'flex-1 rounded-b-none',
            'min-h-[46px]', // TODO: still reliant on height of schedule assignment card
          )}
          onClick={handleCreateAssignment}
        >
          <PlusIcon />
        </Button>
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
            className={cn(
              'h-9 rounded-t-none data-[state=on]:rounded-none',
              assignments && assignments.length > 0 && 'flex-1',
            )}
          >
            <BanIcon />
          </Button>
        </Toggle>
      </div>
    </div>
  )
}
