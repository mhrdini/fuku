import { UserTeam } from '@fuku/api/schemas'
import { Cog, LucideIcon, UserCircle2, Users2 } from 'lucide-react'

export type MenuGroup = {
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

export const useMenu = (team: UserTeam | null): MenuGroup[] => {
  return !team
    ? []
    : [
        {
          label: 'Teams',
          menus: [
            {
              href: `/team/${team.slug}`,
              label: 'Overview',
              icon: Users2,
            },
            {
              href: `/team/${team.slug}/members`,
              label: 'Members',
              icon: UserCircle2,
            },
            {
              href: `/team/${team.slug}/settings`,
              label: 'Settings',
              icon: Cog,
            },
          ],
        },
      ]
}
