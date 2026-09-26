import { useMemo, useState } from 'react'

import { useTranslation } from '@fuku/i18n/react'
import { Button, Collapsible, CollapsibleContent, CollapsibleTrigger, Skeleton } from '@fuku/ui/components'
import { cn } from '@fuku/ui/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { ChevronDownIcon } from 'lucide-react'

import { useTRPC } from '~/trpc/client'

import { ScheduleRequirements } from '../../schedule-requirements'

export function ScheduleRequirementsPanel({
  teamId,
}: {
  teamId: string | undefined
}) {
  const { t } = useTranslation()
  const trpc = useTRPC()
  const [open, setOpen] = useState(false)

  const { data: operationalHours } = useQuery({
    ...trpc.operationalHour.list.queryOptions({ teamId: teamId! }),
    enabled: !!teamId,
  })

  const openDays = useMemo(() => Object.values(operationalHours ?? {}).filter(
    day => !day?.deletedAt,
  ).length, [operationalHours])

  return (
    !teamId
      ? <Skeleton />
      : (
          <Collapsible
            open={open}
            onOpenChange={setOpen}
            className='w-full'
          >
            <div className='flex items-center justify-between'>
              <CollapsibleTrigger asChild>
                <Button className='w-full open:not-aria-[haspopup]:translate-y-0' variant='ghost'>
                  {t('scheduleRequirements', 'Schedule Requirements')}
                  <span className='text-muted-foreground text-xs font-normal'>
                    {t('lengthDaysOpen', '{{length}} day(s) open', {
                      length: openDays,
                    })}
                  </span>
                  <ChevronDownIcon
                    className={cn(
                      'transition-transform',
                      open && 'rotate-180',
                    )}
                  />
                </Button>
              </CollapsibleTrigger>
            </div>

            <CollapsibleContent>
              <div className='p-2'>
                <ScheduleRequirements teamId={teamId} />
              </div>
            </CollapsibleContent>
          </Collapsible>
        )
  )
}
