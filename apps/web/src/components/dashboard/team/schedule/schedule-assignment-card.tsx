'use client'

import { useCallback, useMemo } from 'react'

import { CollisionPriority } from '@dnd-kit/abstract'
import { useSortable } from '@dnd-kit/react/sortable'
import { useTranslation } from '@fuku/i18n/react'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@fuku/ui/components'
import { cn } from '@fuku/ui/lib/utils'
import { ChevronDownIcon, TrashIcon } from 'lucide-react'

import type { ShiftTypeOutput } from '@fuku/api/schemas'
import type { SchedulerAssignment } from '@fuku/domain/schemas'

import { useScheduleActions } from '~/hooks/schedule/use-schedule-actions'

type ScheduleAssignmentCardProps = {
  cellKey: string
  assignment: SchedulerAssignment
  data: {
    eligibleShifts: Map<string, ShiftTypeOutput>
    shiftTypeMap: Map<string, ShiftTypeOutput>
  }
  className?: string
}

export function ScheduleAssignmentCard({
  cellKey,
  assignment,
  data: { eligibleShifts, shiftTypeMap },
  className,
}: ScheduleAssignmentCardProps) {
  const { t } = useTranslation()

  const { ref } = useSortable({
    id: assignment.id,
    index: 0,
    type: 'assignment',
    data: {
      assignment,
      cellKey,
    },
    collisionPriority: CollisionPriority.Lowest,
  })

  const { updateAssignmentShiftType, deleteAssignmentById }
    = useScheduleActions()

  const handleUpdateShiftType = (shiftTypeId: string) => {
    if (shiftTypeId !== assignment.shiftTypeId)
      updateAssignmentShiftType({ assignmentId: assignment.id, shiftTypeId })
  }

  const handleDeleteAssignment = useCallback(() => {
    deleteAssignmentById(assignment.id)
  }, [assignment.id, deleteAssignmentById])

  const eligibleShiftTypes = useMemo(
    () => Array.from(eligibleShifts.entries()),
    [eligibleShifts],
  )

  const shiftType = useMemo(() => {
    return shiftTypeMap.get(assignment.shiftTypeId)
  }, [assignment.shiftTypeId, shiftTypeMap])

  return (
    <div
      ref={ref}
      className={cn(
        'min-h-12',
        'group/assignment border-input bg-muted relative flex flex-col rounded-none border px-2 py-1',
        'opacity-100 transition-all',
        className,
      )}
    >
      <div className='text-sm font-bold'>{shiftType?.name ?? ''}</div>
      <div className='text-muted-foreground text-xs'>
        {shiftType?.startTime ?? ''}
        {shiftType?.endTime ? t('key', ' - ') + shiftType?.endTime : ''}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size='icon-chip'
            variant='secondary'
            className='absolute top-1.5 right-2 opacity-0 transition-opacity group-hover/assignment:opacity-100'
            // className='flex items-center bg-ring/50 text-secondary-foreground/80 hover:text-secondary-foreground active:text-secondary-foreground hover:bg-ring/80 p-1'
          >
            <ChevronDownIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className='max-w-min' align='end' side='bottom'>
          <DropdownMenuRadioGroup
            value={assignment.shiftTypeId}
            onValueChange={handleUpdateShiftType}
          >
            {eligibleShiftTypes.map(([id, st]) => (
              <DropdownMenuRadioItem key={id} value={st.id}>
                {st.name}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={handleDeleteAssignment}
            variant='destructive'
          >
            <TrashIcon />
            <div className='whitespace-nowrap'>{t('delete', 'Delete')}</div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
