'use client'

import { useCallback } from 'react'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@fuku/ui/components'
import { Check, ChevronDown } from 'lucide-react'

import { useScheduleStore } from '~/store/schedule.store'

export const ScheduleFooter = () => {
  const { setSchedulerAssignments, setSchedulerUnavailabilities } =
    useScheduleStore()

  const handleClearShifts = useCallback(() => {
    setSchedulerAssignments([])
  }, [])

  const handleClearUnavailabilities = useCallback(() => {
    setSchedulerUnavailabilities([])
  }, [])

  const handleClearAll = useCallback(() => {
    setSchedulerAssignments([])
    setSchedulerUnavailabilities([])
  }, [])

  return (
    <div className='flex gap-2 justify-end items-center'>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='outline'>
            Clear
            <ChevronDown />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuItem onClick={handleClearShifts}>
            Clear shifts
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleClearUnavailabilities}>
            Clear unavailabilities
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleClearAll} variant='destructive'>
            Clear all
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button disabled>
        Save
        <Check />
      </Button>
    </div>
  )
}
