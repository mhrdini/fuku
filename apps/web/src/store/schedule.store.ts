import { UnavailabilityOutput } from '@fuku/api/schemas'
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
  updateAssignment: (params: {
    assignmentId: string
    updatedFields: Partial<Omit<SchedulerAssignment, 'id'>>
  }) => void
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

type UnavailabilitySlice = {
  schedulerUnavailabilities: UnavailabilityOutput[]
  setSchedulerUnavailabilities: (
    schedulerUnavailabilities: UnavailabilityOutput[],
  ) => void
  createUnavailability: (input: { teamMemberId: string; date: Date }) => void
  deleteUnavailability: (unavailabilityId: string) => void
}

type MetricsSlice = {
  teamMemberMetricsMap: Map<string, TeamMemberMetrics> // teamMemberId -> metrics
  dayMetricsMap: Map<string, DayMetrics> // date string (e.g. '2024-01-01') -> metrics
  setSchedulerMetrics: (metrics: Partial<SchedulerMetrics>) => void
}

type ScheduleStore = DateRangeSlice &
  AssignmentSlice &
  UnavailabilitySlice &
  MetricsSlice

type PersistedScheduleStore = Pick<
  ScheduleStore,
  'range' | 'schedulerAssignments' | 'schedulerUnavailabilities'
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
      updateAssignment: ({ assignmentId, updatedFields }) =>
        set(state => {
          const schedulerAssignments = state.schedulerAssignments.map(a =>
            a.id === assignmentId ? { ...a, ...updatedFields } : a,
          )
          return { ...state, schedulerAssignments }
        }),
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
      schedulerUnavailabilities: [],
      setSchedulerUnavailabilities: (
        schedulerUnavailabilities: UnavailabilityOutput[],
      ) => set({ schedulerUnavailabilities }),
      createUnavailability: ({ teamMemberId, date }) =>
        set(state => ({
          schedulerUnavailabilities: [
            ...state.schedulerUnavailabilities,
            {
              // id: getCellKey(teamMemberId, new Date(date)),
              id: crypto.randomUUID(),
              teamMemberId,
              date,
            },
          ],
        })),
      deleteUnavailability: unavailabilityId =>
        set(state => ({
          schedulerUnavailabilities: state.schedulerUnavailabilities.filter(
            u => u.id !== unavailabilityId,
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
        schedulerUnavailabilities: state.schedulerUnavailabilities,
      }),
    },
  ),
)
