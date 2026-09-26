'use client'

import { useMemo } from 'react'

import { useParams } from 'next/navigation'

import { useTranslation } from '@fuku/i18n/react'
import {
  BadgeDollarSignIcon,
  CalendarIcon,
  ClockIcon,
  CogIcon,
  MapPinIcon,
  UserCircle2Icon,
  Users2Icon,
} from 'lucide-react'

import type { UserTeam } from '@fuku/api/schemas'
import type {
  LucideIcon,
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

export function useSidebarMenu(team: UserTeam | null): MenuGroup[] {
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
              href: `/${username}/team/${team.publicId}`,
              label: t('overview', 'Overview'),
              icon: Users2Icon,
            },
            {
              href: `/${username}/team/${team.publicId}/schedule`,
              label: t('schedule', 'Schedule'),
              icon: CalendarIcon,
            },
            {
              href: `/${username}/team/${team.publicId}/members`,
              label: t('members', 'Members'),
              icon: UserCircle2Icon,
            },
            {
              href: `/${username}/team/${team.publicId}/settings`,
              label: t('settings', 'Settings'),
              icon: CogIcon,
            },
          ],
        },
      ]
}

export function useNavigationMenu(username: string | null, team: UserTeam | null): Menu[] {
  const { t, i18n } = useTranslation()
  const menu = useMemo(() => {
    if (!username || !team)
      return []

    return [
      {
        label: t('team', 'Team'),
        href: `/${username}/team`,
        icon: Users2Icon,
        submenus: [
          {
            label: t('overview', 'Overview'),
            href: `/${username}/team/${team.publicId}`,
            icon: Users2Icon,
          },
          {
            label: t('members', 'Members'),
            href: `/${username}/team/${team.publicId}/members`,
            icon: UserCircle2Icon,
          },
          {
            label: t('payGrades', 'Pay Grades'),
            href: `/${username}/team/${team.publicId}/pay-grades`,
            icon: BadgeDollarSignIcon,
          },
          {
            label: t('shiftTypes', 'Shift Types'),
            href: `/${username}/team/${team.publicId}/shift-types`,
            icon: ClockIcon,
          },
          {
            label: t('locations', 'Locations'),
            href: `/${username}/team/${team.publicId}/locations`,
            icon: MapPinIcon,
          },
          {
            label: t('settings', 'Settings'),
            href: `/${username}/team/${team.publicId}/settings`,
            icon: CogIcon,
          },
        ],
      },
      {
        label: t('schedule', 'Schedule'),
        href: `/${username}/team/${team.publicId}/schedule`,
        icon: CalendarIcon,
      },
    ]
  }, [username, team, i18n.resolvedLanguage])

  return menu
}
