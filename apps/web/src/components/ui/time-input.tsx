'use client'

import { useEffect, useState } from 'react'
import { Input } from '@fuku/ui/components'
import { cn } from '@fuku/ui/lib/utils'

interface TimeInputProps {
  id: string
  value: string // "HH:MM"
  timeType: 'startTime' | 'endTime'
  disabled?: boolean
  onChange: (payload: {
    id: string
    timeType: 'startTime' | 'endTime'
    time: string
  }) => Promise<void>
}

const DEFAULT_TIME = '09:00'

export function TimeInput({
  id,
  value,
  timeType,
  onChange,
  disabled,
}: TimeInputProps) {
  const [draft, setDraft] = useState(value || DEFAULT_TIME)

  useEffect(() => {
    setDraft(value)
  }, [value])

  const commit = async (time: string) => {
    if (!time) return

    setDraft(time)

    await onChange({
      id,
      timeType,
      time,
    })
  }

  return (
    <Input
      type='time'
      value={draft}
      step={60} // minute precision (HH:MM)
      disabled={disabled}
      className={cn(
        'appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none',
        'w-full h-full min-w-0 text-sm p-0 m-0 border-none rounded-none focus-visible:ring-0 shadow-none',
        'text-center tabular-nums',
      )}
      onChange={e => {
        setDraft(e.target.value)
      }}
      onBlur={e => {
        const time = e.currentTarget.value
        void commit(time)
      }}
    />
  )
}
