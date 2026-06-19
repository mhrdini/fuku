'use client'

import { useMemo } from 'react'
import { useParams } from 'next/navigation'
import { UserTeam } from '@fuku/api/schemas'
import { useTranslation } from '@fuku/i18n/react'
import {
  BadgeDollarSign,
  Calendar,
  Clock,
  Cog,
  LucideIcon,
  MapPin,
  UserCircle2,
  Users2,
} from 'lucide-react'

export type MenuGroup = {
  label: string
  menus: Menu[]
}

export type Menu = {
  href: string
  label: string
  active?: boolean
  icon: LucideIcon
  submenus?: Menu[]
}

export const useSidebarMenu = (team: UserTeam | null): MenuGroup[] => {
  const { t } = useTranslation()
  const params = useParams()
  const username = params.username as string

  return !team || !username
    ? []
    : [
        {
          label: t('team', 'Team'),
          menus: [
            {
              href: `/${username}/team/${team.slug}`,
              label: t('overview', 'Overview'),
              icon: Users2,
            },
            {
              href: `/${username}/team/${team.slug}/schedule`,
              label: t('schedule', 'Schedule'),
              icon: Calendar,
            },
            {
              href: `/${username}/team/${team.slug}/members`,
              label: t('members', 'Members'),
              icon: UserCircle2,
            },
            {
              href: `/${username}/team/${team.slug}/settings`,
              label: t('settings', 'Settings'),
              icon: Cog,
            },
          ],
        },
      ]
}

export const useNavigationMenu = (
  username: string | null,
  team: UserTeam | null,
): Menu[] => {
  const { t, i18n } = useTranslation()
  const menu = useMemo(() => {
    if (!username || !team) return []

    return [
      {
        label: t('team', 'Team'),
        href: `/${username}/team`,
        icon: Users2,
        submenus: [
          {
            label: t('overview', 'Overview'),
            href: `/${username}/team/${team.slug}`,
            icon: Users2,
          },
          {
            label: t('members', 'Members'),
            href: `/${username}/team/${team.slug}/members`,
            icon: UserCircle2,
          },
          {
            label: t('payGrades', 'Pay Grades'),
            href: `/${username}/team/${team.slug}/pay-grades`,
            icon: BadgeDollarSign,
          },
          {
            label: t('shiftTypes', 'Shift Types'),
            href: `/${username}/team/${team.slug}/shift-types`,
            icon: Clock,
          },
          {
            label: t('locations', 'Locations'),
            href: `/${username}/team/${team.slug}/locations`,
            icon: MapPin,
          },
          {
            label: t('settings', 'Settings'),
            href: `/${username}/team/${team.slug}/settings`,
            icon: Cog,
          },
        ],
      },
      {
        label: t('schedule', 'Schedule'),
        href: `/${username}/team/${team.slug}/schedule`,
        icon: Calendar,
      },
    ]
  }, [username, team, i18n.resolvedLanguage])

  return menu
}
