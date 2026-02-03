'use client'

import { Separator, SidebarTrigger } from '@fuku/ui/components'

import { LogOutButton } from '~/components/auth/log-out-button'
import { Breadcrumbs } from './breadcrumbs'

export const DashboardHeader = () => {
  return (
    <header className='bg-card sticky top-0 z-50 flex items-center justify-between gap-4 border-b px-4 py-2 sm:px-6 xl:gap-6'>
      <div className='flex items-center gap-4'>
        <SidebarTrigger className='[&_svg]:!size-5' />
        <Separator orientation='vertical' className='hidden !h-4 sm:block' />
        <Breadcrumbs />
      </div>
      <div className='flex items-center gap-1.5'>
        {/* Header actions */}
        <LogOutButton />
      </div>
    </header>
  )
}
