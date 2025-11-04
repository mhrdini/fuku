import { Skeleton } from '@fuku/ui/components'

export const ContentSkeleton = () => {
  return (
    <>
      <Skeleton className='h-4 w-1/3 rounded-md' />
      <Skeleton className='h-60 w-full rounded-md' />
      <Skeleton className='h-60 w-full rounded-md' />
    </>
  )
}
