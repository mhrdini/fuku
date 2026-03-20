import { useMemo } from 'react'
import { useParams } from 'next/navigation'
import { UserTeam } from '@fuku/api/schemas'
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
  const params = useParams()
  const username = params.username as string

  return !team || !username
    ? []
    : [
        {
          label: 'Team',
          menus: [
            {
              href: `/${username}/team/${team.slug}`,
              label: 'Overview',
              icon: Users2,
            },
            {
              href: `/${username}/team/${team.slug}/schedule`,
              label: 'Schedule',
              icon: Calendar,
            },
            {
              href: `/${username}/team/${team.slug}/members`,
              label: 'Members',
              icon: UserCircle2,
            },
            {
              href: `/${username}/team/${team.slug}/settings`,
              label: 'Settings',
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
  const menu = useMemo(() => {
    if (!username || !team) return []

    return [
      {
        label: 'Team',
        href: `/${username}/team`,
        icon: Users2,
        submenus: [
          {
            label: 'Overview',
            href: `/${username}/team/${team.slug}`,
            icon: Users2,
          },
          {
            label: 'Members',
            href: `/${username}/team/${team.slug}/members`,
            icon: UserCircle2,
          },
          {
            label: 'Pay Grades',
            href: `/${username}/team/${team.slug}/pay-grades`,
            icon: BadgeDollarSign,
          },
          {
            label: 'Shift Types',
            href: `/${username}/team/${team.slug}/shift-types`,
            icon: Clock,
          },
          {
            label: 'Locations',
            href: `/${username}/team/${team.slug}/locations`,
            icon: MapPin,
          },
          {
            label: 'Settings',
            href: `/${username}/team/${team.slug}/settings`,
            icon: Cog,
          },
        ],
      },
      {
        label: 'Schedule',
        href: `/${username}/team/${team.slug}/schedule`,
        icon: Calendar,
      },
    ]
  }, [username, team])

  return menu
}
