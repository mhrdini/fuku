import { useMemo } from 'react'
import { Fragment } from 'react/jsx-runtime'
import { useDragOperation } from '@dnd-kit/react'
import { ShiftTypeOutput } from '@fuku/api/schemas'
import { SchedulerAssignment } from '@fuku/domain/schemas'
import { cn } from '@fuku/ui/lib/utils'

import { ScheduleFilters } from '~/hooks/schedule/useScheduleFilters'
import { CellData, Day, getCellKey, TeamMemberData } from '~/lib/schedule'
import { ScheduleCell } from './schedule-cell'
import { ScheduleTeamMemberCell } from './schedule-team-member-cell'

interface ScheduleRowProps {
  teamMember: TeamMemberData
  isLastRow: boolean
  days: Day[]
  data: {
    cellMap: Map<string, CellData>
    shiftTypeMap: Map<string, ShiftTypeOutput>
  }
  filters: ScheduleFilters
}

export const ScheduleRow = ({
  teamMember: tm,
  isLastRow,
  days: daysRowList,
  data: { shiftTypeMap, cellMap },
  filters: { filteredShiftTypes },
}: ScheduleRowProps) => {
  const eligibleShifts = useMemo(() => {
    if (!tm.payGradeId) return new Map<string, ShiftTypeOutput>()

    const entries = Array.from(shiftTypeMap.values())
      .filter(st =>
        st.eligiblePayGrades.some(pgst => pgst.payGradeId === tm.payGradeId),
      )
      .map(st => [st.id, st] as const)

    return new Map(entries)
  }, [tm.payGradeId, shiftTypeMap])
  // dnd
  const { source, target } = useDragOperation()

  const sourceCellKey = useMemo(
    () =>
      source && source.type === 'assignment'
        ? (source.data.cellKey as string)
        : null,
    [source],
  )

  const targetAssignment = useMemo(
    () =>
      target && target.type === 'cell'
        ? cellMap.get(target.id as string)?.schedulerAssignments[0]
        : null,
    [target],
  )

  return (
    <Fragment key={tm.id}>
      {/* member cell */}
      <div
        className={cn(
          'sticky left-0 z-20 w-[250px] bg-background border-r border-input',
          // 'flex flex-col h-full',
          !isLastRow && 'border-b',
        )}
      >
        <ScheduleTeamMemberCell teamMember={tm} />
      </div>

      {/* shift cells */}
      {daysRowList.map((day, idx) => {
        const cellKey = getCellKey(tm.id, day.date)
        const cellData = cellMap.get(cellKey)
        const isLastCol = idx === daysRowList.length - 1

        let previewAssignment: SchedulerAssignment | null = null

        // show target assignment in source cell as a preview assignment
        if (cellKey === sourceCellKey && targetAssignment) {
          previewAssignment = targetAssignment
        }

        return (
          <ScheduleCell
            key={cellKey}
            cellKey={cellKey}
            isLastCol={isLastCol}
            isLastRow={isLastRow}
            data={{
              eligibleShifts,
              cellData,
              shiftTypeMap,
              previewAssignment,
            }}
            filters={{
              filteredShiftTypes,
            }}
          />
        )
      })}
    </Fragment>
  )
}
