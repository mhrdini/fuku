'use client'

import { Button, DateRangePicker } from '@fuku/ui/components'
import { CalendarPlus, Check, Cog } from 'lucide-react'

export const TeamScheduleContent = () => {
  return (
    <div className='flex flex-col gap-6'>
      <h2>Schedule</h2>
      <div className='flex gap-2'>
        <DateRangePicker showCompare={false} />
        <Button variant='secondary' className='ml-auto'>
          <Cog />
          Customize
        </Button>
        <Button>
          <CalendarPlus /> Generate
        </Button>
      </div>
      {/* xs breakpoint */}
      <div className='flex sm:hidden'></div>
      {/* sm breakpoint */}
      <div className='hidden sm:flex md:hidden'></div>
      {/* md+ breakpoint */}
      <div className='hidden md:flex'></div>
      <div>
        <Button className='flex ml-auto'>
          Confirm Schedule
          <Check />
        </Button>
      </div>
    </div>
  )
}
