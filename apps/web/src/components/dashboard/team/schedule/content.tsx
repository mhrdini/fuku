'use client'

import { useScheduleData } from '~/hooks/schedule/useScheduleData'
import { useScheduleDerivedData } from '~/hooks/schedule/useScheduleDerivedData'
import { useScheduleFilters } from '~/hooks/schedule/useScheduleFilters'
import { useScheduleView } from '~/hooks/schedule/useScheduleView'
import { ScheduleFooter } from './schedule-footer'
import { ScheduleGrid } from './schedule-grid'
import { ScheduleHeader } from './schedule-header'

export const TeamScheduleContent = () => {
  const viewState = useScheduleView()
  const schedule = useScheduleData(viewState.start, viewState.end)
  const filters = useScheduleFilters({
    teamMembers: schedule.teamMembers || [],
  })
  const derivedData = useScheduleDerivedData({
    start: viewState.start,
    end: viewState.end,
    teamMembers: schedule.teamMembers || [],
    shiftTypes: schedule.shiftTypes || [],
    payGrades: schedule.payGrades || [],
    unavailabilities: schedule.unavailabilities || [],
  })

  return (
    <div className='flex flex-col gap-4'>
      <ScheduleHeader
        viewState={viewState}
        data={schedule}
        derivedData={derivedData}
      />
      {/* TODO: mobile */}
      {/* desktop */}
      <ScheduleGrid
        className='hidden md:block'
        data={schedule}
        filters={filters}
        derivedData={derivedData}
      />
      <ScheduleFooter />
    </div>
  )
}
