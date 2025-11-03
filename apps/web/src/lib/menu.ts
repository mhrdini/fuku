import {
  Cog,
  LayoutGrid,
  LucideIcon,
  Plus,
  UserCircle2,
  Users,
} from 'lucide-react'

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

export const getMenu = (): Group[] => {
  return [
    {
      label: '',
      menus: [
        {
          href: '/',
          label: 'Dashboard',
          icon: LayoutGrid,
        },
      ],
    },
    {
      label: 'Team',
      menus: [
        {
          href: '/team',
          label: 'Team Overview',
          icon: Users,
        },
        {
          href: '/team/members',
          label: 'Members',
          icon: UserCircle2,
          submenus: [
            {
              href: '/team/invite',
              label: 'Invite Members',
              icon: Plus,
            },
          ],
        },
        {
          href: '/team/settings',
          label: 'Team Settings',
          icon: Cog,
        },
      ],
    },
  ]
}
