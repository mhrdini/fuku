import { useParams } from 'next/navigation'
import { SheetHeader, SheetTitle } from '@fuku/ui/components'
import { useSuspenseQuery } from '@tanstack/react-query'

import { useTRPC } from '~/trpc/client'

export const EditLocationFormSheet = () => {
  const params = useParams()
  const slug = params?.slug as string

  const title = 'Locations'

  const trpc = useTRPC()

  const { data: locations } = useSuspenseQuery(
    trpc.location.getAllByTeam.queryOptions({
      teamSlug: slug!,
    }),
  )

  return (
    <>
      <SheetHeader>
        <SheetTitle>{title}</SheetTitle>
      </SheetHeader>
      <div className='grid flex-1 auto-rows-min gap-6 px-4'>
        {locations?.map(location => (
          <div key={location.id} className='grid gap-3'>
            <div className='font-medium'>{location.name}</div>
            <div className='text-sm text-muted-foreground'>
              {location.address}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
