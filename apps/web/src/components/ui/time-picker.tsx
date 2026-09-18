'use client'

import { useState } from 'react'

import { useTranslation } from '@fuku/i18n/react'
import {
  Button,
  Command,
  CommandItem,
  CommandList,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@fuku/ui/components'
import { cn } from '@fuku/ui/lib/utils'

type TimePickerProps = {
  id: string
  value: string // in 24-hr, zero-pcreated "HH:MM" format
  onChange: (payload: {
    id: string
    timeType: 'startTime' | 'endTime'
    time: string
  }) => Promise<void>
}

export function TimePicker({ id, value, onChange }: TimePickerProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [hours, minutes] = value.split(':')

  const hoursList = Array.from({ length: 24 }, (_, i) =>
    i.toString().padStart(2, '0'))

  const minutesList = Array.from({ length: 60 / 5 }, (_, i) =>
    (i * 5).toString().padStart(2, '0'))

  const handleChange = async (
    newTime: string,
    timeType: 'startTime' | 'endTime',
  ) => {
    await onChange({
      id,
      timeType,
      time: newTime,
    })
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          className='h-auto justify-between border-none bg-transparent px-2 py-0 shadow-none'
        >
          {t('hoursminutes', '{{hours}}:{{minutes}}', { hours, minutes })}
        </Button>
      </PopoverTrigger>

      <PopoverContent className='flex w-auto gap-4 p-4'>
        <Command className='w-10 overflow-auto'>
          <CommandList>
            {hoursList.map(h => (
              <CommandItem
                key={h}
                className={cn(
                  h === hours
                  && 'bg-primary text-primary-foreground data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground',
                )}
                onSelect={() => {
                  void handleChange(`${h}:${minutes}`, 'startTime')
                  setOpen(false)
                }}
              >
                {h}
              </CommandItem>
            ))}
          </CommandList>
        </Command>

        <Command className='w-10 overflow-auto'>
          <CommandList>
            {minutesList.map(m => (
              <CommandItem
                key={m}
                className={cn(
                  m === minutes
                  && 'bg-primary text-primary-foreground data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground',
                )}
                onSelect={() => {
                  void handleChange(`${hours}:${m}`, 'endTime')
                  setOpen(false)
                }}
              >
                {m}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
