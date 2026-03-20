'use client'

import { useScheduleData } from '~/hooks/schedule/useScheduleData'
import { useScheduleDerivedData } from '~/hooks/schedule/useScheduleDerivedData'
import { useScheduleFilters } from '~/hooks/schedule/useScheduleFilters'
import { useScheduleMutations } from '~/hooks/schedule/useScheduleMutations'
import { useScheduleView } from '~/hooks/schedule/useScheduleView'
import { ScheduleFooter } from './schedule-footer'
import { ScheduleGrid } from './schedule-grid'
import { ScheduleHeader } from './schedule-header'

export const TeamScheduleContent = () => {
  const viewState = useScheduleView()
  const data = useScheduleData({
    start: viewState.start,
    end: viewState.end,
  })
  const mutations = useScheduleMutations({
    team: data.team,
    start: viewState.start,
    end: viewState.end,
  })
  const filters = useScheduleFilters({
    teamMembers: data.teamMembers || [],
  })
  const derivedData = useScheduleDerivedData({
    viewState,
    data,
  })

  return (
    <div className='flex flex-col gap-4'>
      <ScheduleHeader
        viewState={viewState}
        data={data}
        mutations={mutations}
        derivedData={derivedData}
      />
      {/* TODO: mobile */}
      {/* desktop */}
      <ScheduleGrid
        className='hidden md:block'
        data={data}
        filters={filters}
        derivedData={derivedData}
      />
      <ScheduleFooter />
    </div>
  )
}
