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
  const session = useSession()
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)
  const trpc = useTRPC()

  const { data: team, isFetching } = useQuery({
    ...trpc.team.getActive.queryOptions(),
  })
  const { currentTeamSlug } = useDashboardStore()

  const crumbs = useMemo(() => {
    const length = segments.length - 1

    return segments
      .map((segment, idx) => {
        if (length > MAX_VISIBLE && idx !== 0 && idx < length - MAX_TRAILING) {
          return idx === 1 ? '…' : null
        }
        return segment
      })
      .filter(Boolean)
      .map((segment, idx, arr) => {
        if (!segment) return null
        if (segment === '…') return { href: '', label: '…' }

        let label = decodeURIComponent(segment)
          .replace(/-/g, ' ')
          .replace(/\b\w/g, c => c.toUpperCase())

        if (segment === session?.user.username) label = 'Home'
        if (segment === currentTeamSlug && team && team.lastActiveTeam)
          label = team.lastActiveTeam.name
        if (segment === 'team') return null

        const href =
          '/' +
          arr
            .slice(0, idx + 1)
            .filter(s => s !== '…')
            .join('/')

        return { href, label }
      })
      .filter(Boolean) as { href: string; label: string }[]
  }, [segments, team, currentTeamSlug, session?.user.username])

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {isFetching ? (
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
