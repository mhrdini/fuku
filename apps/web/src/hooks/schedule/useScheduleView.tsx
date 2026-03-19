import { useState } from 'react'
import { DateTime } from 'luxon'

import {
  defaultDateRangesByView,
  getDefaultDateRangeByView,
  ViewOption,
} from '~/lib/schedule'

export const useScheduleView = () => {
  const [view, setView] = useState<ViewOption>('month')
  const [start, setStart] = useState(defaultDateRangesByView[view].from)
  const [end, setEnd] = useState(defaultDateRangesByView[view].to)

  const handleViewChange = (view: ViewOption) => {
    setView(view)
    const { from, to } = getDefaultDateRangeByView(view, start)
    setStart(from)
    setEnd(to)
  }

  const handleNextRange = () => {
    switch (view) {
      case 'day': {
        const nextDay = DateTime.fromJSDate(start).plus({ days: 1 })
        setStart(nextDay.startOf('day').toJSDate())
        setEnd(nextDay.endOf('day').toJSDate())
        break
      }
      case 'week': {
        const nextWeek = DateTime.fromJSDate(start).plus({ days: 7 })
        const nextWeekEnd = nextWeek.plus({ days: 6 })
        setStart(nextWeek.startOf('day').toJSDate())
        setEnd(nextWeekEnd.endOf('day').toJSDate())
        break
      }
      case 'month': {
        const nextMonth = DateTime.fromJSDate(start).plus({ months: 1 })
        setStart(nextMonth.startOf('month').toJSDate())
        setEnd(nextMonth.endOf('month').toJSDate())
        break
      }
    }
  }

  const handlePrevRange = () => {
    switch (view) {
      case 'day': {
        const prevDay = DateTime.fromJSDate(start).minus({ days: 1 })
        setStart(prevDay.startOf('day').toJSDate())
        setEnd(prevDay.endOf('day').toJSDate())
        break
      }
      case 'week': {
        const prevWeek = DateTime.fromJSDate(start).minus({ days: 7 })
        const prevWeekEnd = prevWeek.plus({ days: 6 })
        setStart(prevWeek.startOf('day').toJSDate())
        setEnd(prevWeekEnd.endOf('day').toJSDate())
        break
      }
      case 'month': {
        const prevMonth = DateTime.fromJSDate(start).minus({ months: 1 })
        setStart(prevMonth.startOf('month').toJSDate())
        setEnd(prevMonth.endOf('month').toJSDate())
        break
      }
    }
  }

  return {
    view,
    start,
    end,
    setView,
    setStart,
    setEnd,
    handleNextRange,
    handlePrevRange,
    handleViewChange,
  }
}

export type ScheduleViewState = ReturnType<typeof useScheduleView>
