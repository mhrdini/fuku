import { useParams } from 'next/navigation'
import { Cog, LucideIcon, UserCircle2, Users } from 'lucide-react'

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
  const params = useParams()
  const currentTeamSlug = params.slug as string

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
