'use client'

import { useEffect, useState } from 'react'

import { Input } from '@fuku/ui/components'
import { cn } from '@fuku/ui/lib/utils'

type TimeInputProps = {
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
    if (!time)
      return

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
        'm-0 h-full w-full min-w-0 rounded-none border-none p-0 text-sm shadow-none focus-visible:ring-0',
        'text-center tabular-nums',
        '!bg-transparent dark:!bg-transparent',
      )}
      onChange={(e) => {
        setDraft(e.target.value)
      }}
      onBlur={(e) => {
        const time = e.currentTarget.value
        void commit(time)
      }}
    />
  )
}
