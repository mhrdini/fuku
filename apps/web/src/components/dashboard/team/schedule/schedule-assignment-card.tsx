'use client'

import { useCallback, useMemo } from 'react'
import { useDraggable } from '@dnd-kit/react'
import { ShiftTypeOutput } from '@fuku/api/schemas'
import { SchedulerAssignment } from '@fuku/domain/schemas'
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
import { getCellKey } from '~/lib/schedule'

interface ScheduleAssignmentCardProps {
  assignment: SchedulerAssignment
  shiftTypeMap: Map<string, ShiftTypeOutput>
  className?: string
}

export const ScheduleAssignmentCard = ({
  assignment,
  shiftTypeMap,
  className,
}: ScheduleAssignmentCardProps) => {
  const { ref } = useDraggable({
    id: assignment.id,
    type: 'assignment',
    data: {
      assignment,
      cellKey: getCellKey(assignment.teamMemberId, assignment.date),
    },
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
        'relative group/assignment rounded-md py-1 px-2 border border-input bg-muted flex flex-col',
        className,
      )}
    >
      <div className='font-bold text-sm'>{shiftType?.name ?? ''}</div>
      <div className='text-xs text-muted-foreground'>
        {shiftType?.startTime ?? ''}
        {shiftType?.endTime ? ' - ' + shiftType?.endTime : ''}
      </div>
      <DropdownMenu>
        <div className='absolute top-2 right-2 opacity-0 group-hover/assignment:opacity-100 transition-opacity'>
          <DropdownMenuTrigger asChild>
            <Button
              size='icon-chip'
              className='flex items-center bg-ring/50 text-secondary-foreground/80 hover:text-secondary-foreground active:text-secondary-foreground hover:bg-ring/80 p-1'
            >
              <ChevronDown className='size-3' />
            </Button>
          </DropdownMenuTrigger>
        </div>
        <DropdownMenuContent className='max-w-min' align='center' side='bottom'>
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
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
