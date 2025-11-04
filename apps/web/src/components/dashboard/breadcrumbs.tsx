'use client'

import { Fragment, useMemo } from 'react'
import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Skeleton,
} from '@fuku/ui/components'
import { useQuery } from '@tanstack/react-query'

import { useDashboardStore } from '~/store/dashboard'
import { useTRPC } from '~/trpc/client'

export function Breadcrumbs() {
  const params = useParams()
  const username = params?.username as string
  const { currentTeamSlug } = useDashboardStore()

  const trpc = useTRPC()

  const { data: team, isPending } = useQuery({
    ...trpc.team.getBySlug.queryOptions({ slug: currentTeamSlug! }),
    enabled: !!currentTeamSlug,
  })

  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  const crumbs = useMemo(() => {
    return segments
      .map((segment, idx) => {
        const href = '/' + segments.slice(0, idx + 1).join('/')

        let label = decodeURIComponent(segment)
          .replace(/-/g, ' ')
          .replace(/\b\w/g, c => c.toUpperCase())

        if (segment === username) {
          label = 'Home'
        }

        if (segment === 'team') {
          return null
        }

        if (segment === currentTeamSlug && team) {
          label = team.name
        }

        return { href, label }
      })
      .filter(
        (crumb): crumb is { href: string; label: string } =>
          crumb !== null && crumb !== undefined,
      )
  }, [segments, team, currentTeamSlug, username])

  return (
    <Breadcrumb className=''>
      <BreadcrumbList>
        {isPending ? (
          <Skeleton className='h-4 w-16' />
        ) : (
          crumbs.map((crumb, idx) => (
            <Fragment key={crumb.href}>
              {idx !== 0 && <BreadcrumbSeparator />}

              <BreadcrumbItem>
                {idx === crumbs.length - 1 || !crumb.href ? (
                  <BreadcrumbPage className='cursor-default'>
                    {crumb.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={crumb.href}>{crumb.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          ))
        )}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
