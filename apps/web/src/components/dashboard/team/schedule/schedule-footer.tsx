'use client'

import { Button } from '@fuku/ui/components'
import { Check } from 'lucide-react'

export const ScheduleFooter = () => {
  return (
    <div className='flex gap-2 justify-end'>
      <Button disabled>
        Save
        <Check />
      </Button>
    </div>
  )
}
