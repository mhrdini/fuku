'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Separator,
  SidebarTrigger,
} from '@fuku/ui/components'

import { LogOutButton } from '~/components/auth/log-out-button'

export const DashboardHeader = () => {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  // Build breadcrumb items
  const crumbs = segments.map((segment, idx) => {
    const href = '/' + segments.slice(0, idx + 1).join('/')
    const label = decodeURIComponent(segment)
      .replace(/-/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase())
    return { href, label }
  })

  return (
    <header className='bg-card sticky top-0 z-50 border-b'>
      <div className='mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-2 sm:px-6'>
        <div className='flex items-center gap-4'>
          <SidebarTrigger className='[&_svg]:!size-5' />
          <Separator orientation='vertical' className='hidden !h-4 sm:block' />
          <Breadcrumb className=''>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href='/'>Home</BreadcrumbLink>
              </BreadcrumbItem>

              {crumbs.map((crumb, idx) => (
                <React.Fragment key={crumb.href}>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {idx === crumbs.length - 1 ? (
                      <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink href={crumb.href}>
                        {crumb.label}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className='flex items-center gap-1.5'>
          {/* Header actions */}
          <LogOutButton />
        </div>
      </div>
    </header>
  )
}
