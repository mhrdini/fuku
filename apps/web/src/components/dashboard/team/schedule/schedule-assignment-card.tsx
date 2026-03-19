'use client'

import { ShiftTypeOutput } from '@fuku/api/schemas'
import { SchedulerAssignment } from '@fuku/domain/schemas'

interface ScheduleAssignmentCardProps {
  assignment: SchedulerAssignment
  shiftType: ShiftTypeOutput
}

export const ScheduleAssignmentCard = ({
  shiftType,
}: ScheduleAssignmentCardProps) => {
  return (
    <div className='rounded-md py-1 px-2 border border-input bg-muted flex flex-col'>
      <div className='font-bold text-sm'>{shiftType.name ?? ''}</div>
      <div className='text-xs text-muted-foreground'>
        {shiftType.startTime ?? ''}
        {shiftType.endTime ? ' - ' + shiftType.endTime : ''}
      </div>
    </div>
  )
}
