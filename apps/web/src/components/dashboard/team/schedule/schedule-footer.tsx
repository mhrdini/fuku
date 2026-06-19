'use client'

import { useCallback } from 'react'
import { useTranslation } from '@fuku/i18n/react'
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
  const { t } = useTranslation()
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
            {t('clear', 'Clear')}
            <ChevronDown className='text-muted-foreground' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuItem onClick={handleClearShifts}>
            {t('clearShifts', 'Clear shifts')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleClearUnavailabilities}>
            {t('clearUnavailabilities', 'Clear unavailabilities')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleClearAll} variant='destructive'>
            {t('clearAll', 'Clear all')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button disabled>
        {t('save', 'Save')}
        <Check />
      </Button>
    </div>
  )
}
