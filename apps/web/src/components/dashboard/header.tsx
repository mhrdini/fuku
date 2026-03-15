'use client'

import { LogOutButton } from '~/components/auth/log-out-button'
import { ThemeToggle } from '../theme-toggle'
import { Breadcrumbs } from './breadcrumbs'
import { DashboardNavigationMenu } from './dashboard-navigation-menu'
import { TeamSelectDropdownMenu } from './team-select-dropdown-menu'

export const DashboardHeader = () => {
  return (
    <header className='bg-card sticky top-0 z-50 *:flex *:items-center border-b *:gap-4 *:xl:gap-6 *:py-2'>
      <div className='*:flex *:items-center breakpoint-container justify-between border-b'>
        <div className='gap-4'>
          {/* <SidebarTrigger className='[&_svg]:!size-5' /> */}
          {/* <Separator orientation='vertical' className='hidden !h-4 sm:block' /> */}
          <TeamSelectDropdownMenu />
          <DashboardNavigationMenu />
        </div>
        <div className='gap-1.5'>
          <ThemeToggle />
          <LogOutButton />
        </div>
      </div>
      <div className='*:flex *:items-center breakpoint-container'>
        <Breadcrumbs />
      </div>
    </header>
  )
}
