'use client'

import { Fragment, useMemo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Skeleton,
} from '@fuku/ui/components'
import { cn } from '@fuku/ui/lib/utils'
import { useQuery } from '@tanstack/react-query'

import { useDashboardStore } from '~/store/dashboard'
import { useTRPC } from '~/trpc/client'
import { useSession } from '../providers/session-provider'

const MAX_VISIBLE = 3
const MAX_TRAILING = 1

export function Breadcrumbs() {
  const { currentTeamSlug } = useDashboardStore()
  const session = useSession()

  const trpc = useTRPC()

  const { data: team, isPending } = useQuery({
    ...trpc.team.getBySlug.queryOptions({ slug: currentTeamSlug! }),
    enabled: !!currentTeamSlug,
  })

  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  const crumbs = useMemo(() => {
    // ignore the 'team' segment
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
        if (segment === null) return null
        if (segment === '…') return { href: '', label: '…' }

        let label = decodeURIComponent(segment)
          .replace(/-/g, ' ')
          .replace(/\b\w/g, c => c.toUpperCase())

        if (segment === session?.user.username) label = 'Home'
        if (segment === currentTeamSlug && team) label = team.name
        if (segment === 'team') return null

        const href =
          '/' +
          arr
            .slice(0, idx + 1)
            .filter(s => s !== '…')
            .join('/')

        return { href, label }
      })
      .filter(
        (crumb): crumb is { href: string; label: string } => crumb !== null,
      )
  }, [segments, team, currentTeamSlug, session?.user.username])

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
                  <BreadcrumbPage
                    className={cn(
                      idx === crumbs.length - 1 && 'font-semibold',
                      'cursor-default',
                    )}
                  >
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
