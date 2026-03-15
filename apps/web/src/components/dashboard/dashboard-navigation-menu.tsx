import Link from 'next/link'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@fuku/ui/components'
import { useQuery } from '@tanstack/react-query'

import { Menu, useNavigationMenu } from '~/lib/menu'
import { useTRPC } from '~/trpc/client'

export const DashboardNavigationMenu = () => {
  const trpc = useTRPC()

  const { data: sidebarState } = useQuery({
    ...trpc.user.getSidebarState.queryOptions(),
  })
  const menu = useNavigationMenu(sidebarState ? sidebarState.activeTeam : null)

  return (
    <NavigationMenu>
      <NavigationMenuList>
        {menu.map((m: Menu) => (
          <NavigationMenuItem key={m.href}>
            {m.submenus?.length ? (
              <NavigationMenuTrigger>{m.label}</NavigationMenuTrigger>
            ) : (
              <NavigationMenuLink asChild>
                <Link href={m.href}>{m.label}</Link>
              </NavigationMenuLink>
            )}
            {m.submenus?.length && (
              <NavigationMenuContent className='w-max'>
                {m.submenus.map(sm => (
                  <NavigationMenuLink key={sm.href} asChild>
                    <Link
                      href={sm.href}
                      className='flex flex-row items-center gap-2 whitespace-nowrap'
                    >
                      <sm.icon />
                      {sm.label}
                    </Link>
                  </NavigationMenuLink>
                ))}
              </NavigationMenuContent>
            )}
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  )
}
