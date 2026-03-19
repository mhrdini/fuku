import { SchedulerAssignment } from '@fuku/domain/schemas'
import { DateRange } from '@fuku/ui/components'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { DayMetrics, SchedulerMetrics, TeamMemberMetrics } from '~/lib/schedule'
import { mapStorage } from '~/lib/store'

// import { mapStorage } from '~/lib/store'

type DateRangeSlice = {
  range: DateRange
  updateRange: (values: { range: DateRange }) => void
}

type AssignmentSlice = {
  schedulerAssignments: SchedulerAssignment[]
  setSchedulerAssignments: (schedulerAssignments: SchedulerAssignment[]) => void
  moveAssignment: (params: {
    assignmentId: string
    toTeamMemberId: string
    toDate: Date
  }) => void

  createAssignment: (input: {
    teamMemberId: string
    date: Date
    shiftTypeId: string
  }) => void

  deleteAssignment: (assignmentId: string) => void
}

type MetricsSlice = {
  teamMemberMetricsMap: Map<string, TeamMemberMetrics> // teamMemberId -> metrics
  dayMetricsMap: Map<string, DayMetrics> // date string (e.g. '2024-01-01') -> metrics
  setSchedulerMetrics: (metrics: Partial<SchedulerMetrics>) => void
}

type ScheduleStore = DateRangeSlice & AssignmentSlice & MetricsSlice

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
      moveAssignment: ({ assignmentId, toTeamMemberId, toDate }) =>
        set(state => {
          const schedulerAssignments = state.schedulerAssignments.map(a =>
            a.id === assignmentId
              ? { ...a, teamMemberId: toTeamMemberId, date: toDate }
              : a,
          )
          return { ...state, schedulerAssignments }
        }),
      createAssignment: ({ teamMemberId, date, shiftTypeId }) =>
        set(state => ({
          schedulerAssignments: [
            ...state.schedulerAssignments,
            {
              id: crypto.randomUUID(),
              teamMemberId,
              date,
              shiftTypeId,
            },
          ],
        })),
      deleteAssignment: assignmentId =>
        set(state => ({
          schedulerAssignments: state.schedulerAssignments.filter(
            a => a.id !== assignmentId,
          ),
        })),
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
