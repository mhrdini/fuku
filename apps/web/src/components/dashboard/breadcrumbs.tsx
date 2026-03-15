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
} from '@fuku/ui/components'
import { cn } from '@fuku/ui/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { Home } from 'lucide-react'

import { useTRPC } from '~/trpc/client'
import { useSession } from '../providers/session-provider'

const MAX_VISIBLE = 3
const MAX_TRAILING = 1

export function Breadcrumbs() {
  const session = useSession()
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)
  const trpc = useTRPC()

  const params = useParams()
  const slug = params.slug as string | undefined
  const { data: team } = useQuery({
    ...trpc.team.bySlug.queryOptions({ slug: slug! }),
    enabled: !!slug,
  })

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

        let href =
          '/' +
          arr
            .slice(0, idx + 1)
            .filter(s => s !== '…')
            .join('/')

        let label = decodeURIComponent(segment)
          .replace(/-/g, ' ')
          .replace(/\b\w/g, c => c.toUpperCase())

        if (segment === session?.user.username) label = 'Home'
        if (segment === team?.slug) label = team ? 'Overview' : ''
        if (segment === 'team') {
          if (!team) return null
          label = team.name
          href = ''
        }

        return { href, label }
      })
      .filter(Boolean) as { href: string; label: string }[]
  }, [segments, team, session?.user.username])

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, idx) => (
          <Fragment key={crumb.href}>
            {idx === 0 ? (
              crumbs.length === 1 ? (
                <>
                  <BreadcrumbLink asChild>
                    <Link href={crumb.href}>
                      <Home className='size-4.5' />
                    </Link>
                  </BreadcrumbLink>
                  <BreadcrumbSeparator />
                </>
              ) : null
            ) : (
              <BreadcrumbSeparator />
            )}
            <BreadcrumbItem>
              {idx === crumbs.length - 1 || !crumb.href ? (
                <BreadcrumbPage
                  className={cn(
                    idx === crumbs.length - 1 && 'font-semibold',
                    'cursor-default whitespace-nowrap w-max flex gap-2 items-center',
                  )}
                >
                  {crumb.label}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={crumb.href}>
                    {idx === 0 ? <Home className='size-4.5' /> : crumb.label}
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
