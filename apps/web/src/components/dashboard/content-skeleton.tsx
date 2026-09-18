import { Skeleton } from '@fuku/ui/components'

export function ContentSkeleton() {
  return (
    <>
      <Skeleton className='h-4 w-1/3 rounded-none' />
      <Skeleton className='h-60 w-full rounded-none' />
      <Skeleton className='h-60 w-full rounded-none' />
    </>
  )
}
