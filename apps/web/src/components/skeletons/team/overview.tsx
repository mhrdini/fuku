'use client'

import { Skeleton } from '@fuku/ui/components'

export function TeamOverviewSkeleton() {
  return (
    <div className='flex flex-col gap-6'>
      {/* Summary */}
      <div className='flex w-full flex-col gap-4'>
        <div className='flex w-full flex-row items-center'>
          <Skeleton className='h-6 w-24' />
          <Skeleton className='ml-auto h-6 w-40' />
        </div>

        <div className='grid grid-cols-1 gap-4 @[24rem]/main:grid-cols-2 @[50rem]/main:grid-cols-4'>
          <Skeleton className='h-32 w-full' />
          <Skeleton className='h-32 w-full' />
          <Skeleton className='h-32 w-full' />
          <Skeleton className='h-32 w-full' />
        </div>
      </div>

      {/* Schedule requirements */}
      <div className='flex flex-col gap-2 @[50rem]/main:w-fit'>
        <div className='flex flex-col gap-2'>
          {Array.from({ length: 7 }).map((_, index) => (
            <div
              key={index}
              className='flex p-0 gap-2 @[50rem]/main:grid @[50rem]/main:grid-cols-5 @[50rem]/main:grid-rows-2 @[50rem]/main:items-start'
            >
              {/* Weekday */}
              <Skeleton className='h-4 w-24 @[50rem]/main:col-span-1' />

              <div className='grid grid-cols-4 gap-2 @[50rem]/main:contents'>
                {/* Closed */}
                <div className='col-span-4 flex items-center gap-2 @[50rem]/main:col-span-1 @[50rem]/main:col-start-1 @[50rem]/main:row-start-2'>
                  <Skeleton className='size-4' />
                  <Skeleton className='h-4 w-10' />
                </div>

                {/* Start time */}
                <div className='col-span-2 flex flex-col gap-2 @[50rem]/main:col-span-4 @[50rem]/main:col-start-2 @[50rem]/main:row-span-2 @[50rem]/main:row-start-1'>
                  <Skeleton className='h-4 w-full' />
                  <Skeleton className='h-8 w-full' />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
