'use client'

import { useCallback, useMemo } from 'react'
import { CollisionPriority } from '@dnd-kit/abstract'
import { useSortable } from '@dnd-kit/react/sortable'
import { ShiftTypeOutput } from '@fuku/api/schemas'
import { SchedulerAssignment } from '@fuku/domain/schemas'
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
import { ChevronDown, Trash } from 'lucide-react'

import { useScheduleActions } from '~/hooks/schedule/useScheduleActions'

interface ScheduleAssignmentCardProps {
  cellKey: string
  assignment: SchedulerAssignment
  data: {
    shiftTypeMap: Map<string, ShiftTypeOutput>
  }
  className?: string
}

export const ScheduleAssignmentCard = ({
  cellKey,
  assignment,
  data: { shiftTypeMap },
  className,
}: ScheduleAssignmentCardProps) => {
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

  const { updateAssignmentShiftType, deleteAssignmentById } =
    useScheduleActions()

  const handleUpdateShiftType = (shiftTypeId: string) => {
    updateAssignmentShiftType({ assignmentId: assignment.id, shiftTypeId })
  }

  const handleDeleteAssignment = useCallback(() => {
    deleteAssignmentById(assignment.id)
  }, [assignment.id, deleteAssignmentById])

  const shiftTypes = useMemo(
    () => Array.from(shiftTypeMap.entries()),
    [shiftTypeMap],
  )

  const shiftType = useMemo(() => {
    return shiftTypeMap.get(assignment.shiftTypeId)
  }, [shiftTypes, assignment.shiftTypeId])

  return (
    <div
      ref={ref}
      className={cn(
        'relative group/assignment rounded-none py-1 px-2 border border-input bg-muted flex flex-col',
        'transition-all opacity-100',
        className,
      )}
    >
      <div className='font-bold text-sm'>{shiftType?.name ?? ''}</div>
      <div className='text-xs text-muted-foreground'>
        {shiftType?.startTime ?? ''}
        {shiftType?.endTime ? t('key', ' - ') + shiftType?.endTime : ''}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size='icon-chip'
            variant='secondary'
            className='absolute top-1.5 right-2 opacity-0 group-hover/assignment:opacity-100 transition-opacity'
            // className='flex items-center bg-ring/50 text-secondary-foreground/80 hover:text-secondary-foreground active:text-secondary-foreground hover:bg-ring/80 p-1'
          >
            <ChevronDown />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className='max-w-min' align='end' side='bottom'>
          <DropdownMenuRadioGroup
            value={assignment.shiftTypeId}
            onValueChange={handleUpdateShiftType}
          >
            {shiftTypes.map(([id, st]) => (
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
            <Trash />
            {t('delete', 'Delete')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
