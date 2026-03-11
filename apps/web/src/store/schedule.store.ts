import { DayAssignment } from '@fuku/domain/schemas'
import { DateRange } from '@fuku/ui/components'
import { create } from 'zustand'

type ScheduleStore = {
  range: DateRange
  updateRange: (values: { range: DateRange }) => void
  assignments: DayAssignment[]
  setAssignments: (assignments: DayAssignment[]) => void
}

export const useScheduleStore = create<ScheduleStore>(set => ({
  range: { from: new Date(), to: new Date() },
  updateRange: (values: { range: DateRange }) => set({ range: values.range }),
  assignments: [],
  setAssignments: (assignments: DayAssignment[]) => set({ assignments }),
}))
