import {
  Cog,
  LucideIcon,
  Plus,
  UserCircle2,
  Users,
} from 'lucide-react'

import { useDashboardStore } from '~/store/dashboard'

export type Group = {
  label: string
  menus: Menu[]
}

export type Menu = {
  href: string
  label: string
  active?: boolean
  icon: LucideIcon
  submenus?: Submenu[]
}

export type Submenu = {
  href: string
  label: string
  active?: boolean
  icon?: LucideIcon
}

export const useMenu = (): Group[] => {
  const { currentTeamSlug } = useDashboardStore()

  return !currentTeamSlug
    ? []
    : [
        {
          label: 'Teams',
          menus: [
            {
              href: `/team/${currentTeamSlug}`,
              label: 'Overview',
              icon: Users,
            },
            {
              href: `/team/${currentTeamSlug}/members`,
              label: 'Members',
              icon: UserCircle2,
              submenus: [
                {
                  href: `/team/${currentTeamSlug}/invite`,
                  label: 'Invite Members',
                  icon: Plus,
                },
              ],
            },
            {
              href: `/team/${currentTeamSlug}/settings`,
              label: 'Settings',
              icon: Cog,
            },
          ],
        },
      ]
}
