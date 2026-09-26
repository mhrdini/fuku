'use client'

import { Fragment, useMemo } from 'react'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { useTranslation } from '@fuku/i18n/react'
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
import { HomeIcon } from 'lucide-react'

import { useTRPC } from '~/trpc/client'

import { useSession } from '../providers/session-context'

const MAX_VISIBLE = 3
const MAX_TRAILING = 1

export function Breadcrumbs() {
  const { t } = useTranslation()

  const session = useSession()
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)
  const trpc = useTRPC()

  const { data: team } = useQuery({
    ...trpc.team.getActiveTeam.queryOptions(),
    refetchOnWindowFocus: false,
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
        if (!segment)
          return null
        if (segment === '…')
          return { href: '', label: '…' }

        let href
          = `/${
            arr
              .slice(0, idx + 1)
              .filter(s => s !== '…')
              .join('/')}`

        // kebab case to capitalised with spaces
        // let label: string = decodeURIComponent(segment)
        //   .replace(/-/g, ' ')
        //   .replace(/\b\w/g, c => c.toUpperCase())

        // kebab case to camel case
        let label: string = decodeURIComponent(segment)
          .split('-')
          .map((word, index) =>
            index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1),
          )
          .join('')

        if (segment === session?.user.username)
          label = t('home', 'Home')
        if (segment === team?.publicId)
          label = team ? t('overview', 'Overview') : ''
        if (segment === 'team') {
          if (!team)
            return null
          label = team.name
          href = ''
        }

        return { href, label: t(label, label) }
      })
      .filter(Boolean) as { href: string, label: string }[]
  }, [segments, team, session?.user.username, t])

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, idx) => (
          <Fragment key={crumb.href}>
            {idx === 0
              ? (
                  crumbs.length === 1
                    ? (
                        <>
                          <BreadcrumbLink asChild>
                            <Link href={crumb.href}>
                              <HomeIcon className='size-4.5' />
                            </Link>
                          </BreadcrumbLink>
                          <BreadcrumbSeparator />
                        </>
                      )
                    : null
                )
              : (
                  <BreadcrumbSeparator />
                )}
            <BreadcrumbItem>
              {idx === crumbs.length - 1 || !crumb.href
                ? (
                    <BreadcrumbPage
                      className={cn(
                        idx === crumbs.length - 1 && 'font-semibold',
                        'flex w-max cursor-default items-center gap-2 whitespace-nowrap',
                      )}
                    >
                      {team ? (crumb.label) : <Skeleton className='h-4 w-9' />}
                    </BreadcrumbPage>
                  )
                : (
                    <BreadcrumbLink asChild>
                      <Link href={crumb.href}>
                        {idx === 0 ? <HomeIcon className='size-4.5' /> : team ? crumb.label : <Skeleton className='h-4 w-9' />}
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
