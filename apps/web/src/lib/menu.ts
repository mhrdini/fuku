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

export const useNavigationMenu = (team: UserTeam | null): Menu[] => {
  const params = useParams()
  const username = params.username as string

  const menu = useMemo(
    () => [
      {
        label: 'Team',
        href: '',
        icon: Users2,
        submenus: [
          {
            label: 'Overview',
            href: team && username ? `/${username}/team/${team.slug}` : '',
            icon: Users2,
          },
          {
            label: 'Members',
            href:
              team && username ? `/${username}/team/${team.slug}/members` : '',
            icon: UserCircle2,
          },
          {
            label: 'Pay Grades',
            href:
              team && username
                ? `/${username}/team/${team.slug}/pay-grades`
                : '',
            icon: BadgeDollarSign,
          },
          {
            label: 'Shift Types',
            href:
              team && username
                ? `/${username}/team/${team.slug}/shift-types`
                : '',
            icon: Clock,
          },
          {
            label: 'Locations',
            href:
              team && username
                ? `/${username}/team/${team.slug}/locations`
                : '',
            icon: MapPin,
          },
        ],
      },
      {
        label: 'Schedule',
        href: team && username ? `/${username}/team/${team.slug}/schedule` : '',
        icon: Calendar,
      },
      {
        label: 'Settings',
        href: team && username ? `/${username}/team/${team.slug}/settings` : '',
        icon: Cog,
      },
    ],
    [team, username],
  )

  return menu
}
