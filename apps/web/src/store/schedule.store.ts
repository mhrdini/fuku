import { SchedulerAssignment } from '@fuku/api/schemas'
import { DateRange } from '@fuku/ui/components'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { DayMetrics, SchedulerMetrics, TeamMemberMetrics } from '~/lib/schedule'
import { mapStorage } from '~/lib/store'

// import { mapStorage } from '~/lib/store'

type ScheduleStore = {
  range: DateRange
  updateRange: (values: { range: DateRange }) => void
  schedulerAssignments: SchedulerAssignment[]
  setSchedulerAssignments: (schedulerAssignments: SchedulerAssignment[]) => void
  teamMemberMetricsMap: Map<string, TeamMemberMetrics> // teamMemberId -> metrics
  dayMetricsMap: Map<string, DayMetrics> // date string (e.g. '2024-01-01') -> metrics
  setSchedulerMetrics: (metrics: Partial<SchedulerMetrics>) => void
}

type PersistedScheduleStore = Pick<
  ScheduleStore,
  'range' | 'schedulerAssignments'
>

export const useScheduleStore = create<
  ScheduleStore,
  [['zustand/persist', PersistedScheduleStore]]
>(
  persist(
    set => ({
      range: { from: new Date(), to: new Date() },
      updateRange: (values: { range: DateRange }) =>
        set({ range: values.range }),
      schedulerAssignments: [],
      setSchedulerAssignments: (schedulerAssignments: SchedulerAssignment[]) =>
        set({ schedulerAssignments }),
      teamMemberMetricsMap: new Map(),
      dayMetricsMap: new Map(),
      setSchedulerMetrics: (metrics: Partial<SchedulerMetrics>) =>
        set(state => {
          return {
            ...state,
            teamMemberMetricsMap: metrics.teamMemberMetricsMap
              ? metrics.teamMemberMetricsMap
              : state.teamMemberMetricsMap,
            dayMetricsMap: metrics.dayMetricsMap
              ? metrics.dayMetricsMap
              : state.dayMetricsMap,
          }
        }),
    }),
    {
      name: 'schedule',
      storage: mapStorage,
      partialize: state => ({
        range: state.range,
        schedulerAssignments: state.schedulerAssignments,
      }),
    },
  ),
)
