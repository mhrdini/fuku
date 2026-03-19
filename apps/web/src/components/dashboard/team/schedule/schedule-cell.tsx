import { ShiftTypeOutput } from '@fuku/api/schemas'
import { cn } from '@fuku/ui/lib/utils'

import { CellData } from '~/lib/schedule'
import { ScheduleAssignmentCard } from './schedule-assignment-card'

interface ScheduleCellProps {
  cellKey: string
  isLastRow: boolean
  isLastCol: boolean
  data: {
    cellData: CellData | undefined
    shiftTypeMap: Map<string, ShiftTypeOutput>
  }
  className?: string
}

export const ScheduleCell = ({
  cellKey,
  isLastRow,
  isLastCol,
  data: { cellData, shiftTypeMap },
  className,
}: ScheduleCellProps) => {
  return (
    <div
      id={cellKey}
      className={cn(
        'border-input p-1',
        !isLastRow && 'border-b',
        !isLastCol && 'border-r',
        'gap-1.5',
        className,
      )}
    >
      {/* Add assignments, unavailabilities, per cell etc here */}
      {cellData?.schedulerAssignments.map(a => {
        const shiftType = shiftTypeMap?.get(a.shiftTypeId)
        if (!shiftType) return null
        return (
          <ScheduleAssignmentCard
            key={cellKey + '-' + a.shiftTypeId}
            shiftType={shiftType}
          />
        )
      })}
    </div>
  )
}
