'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@fuku/ui/components'
import { ChevronRight, Dot } from 'lucide-react'

import { getMenu } from '~/lib/menu'

export const DashboardSidebar = ({ username }: { username: string }) => {
  const router = useRouter()

  const groups = getMenu()

  const onMenuButtonClick = useCallback(
    (url: string) => {
      router.push('/' + username + url)
    },
    [username],
  )

  return (
    <Sidebar collapsible='icon'>
      <SidebarContent>
        {groups.map(group => (
          <SidebarGroup key={group.label}>
            {group.label && (
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            )}
            {group.menus && (
              <SidebarGroupContent>
                {group.menus.map(menu => {
                  let sidebarMenuContent = null

                  if (!menu.href && menu.submenus) {
                    sidebarMenuContent = (
                      <Collapsible defaultOpen className='group/collapsible'>
                        <SidebarMenuItem>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton>
                              <menu.icon />
                              <span>{menu.label}</span>
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {menu.submenus.map(submenu => (
                                <SidebarMenuSubItem key={submenu.href}>
                                  <SidebarMenuSubButton
                                    onClick={() =>
                                      onMenuButtonClick(submenu.href)
                                    }
                                    className='cursor-pointer'
                                  >
                                    {submenu.icon ? <submenu.icon /> : <Dot />}
                                    {submenu.label}
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </SidebarMenuItem>
                      </Collapsible>
                    )
                  } else if (menu.href && menu.submenus) {
                    sidebarMenuContent = (
                      <Collapsible defaultOpen className='group/collapsible'>
                        <SidebarMenuItem>
                          <SidebarMenuButton
                            onClick={() => onMenuButtonClick(menu.href!)}
                          >
                            <menu.icon />
                            <span>{menu.label}</span>
                          </SidebarMenuButton>
                          <CollapsibleTrigger
                            asChild
                            className='transition-transform data-[state=open]:rotate-90'
                          >
                            <SidebarMenuAction>
                              <ChevronRight className='' />
                            </SidebarMenuAction>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {menu.submenus.map(submenu => (
                                <SidebarMenuSubItem key={submenu.href}>
                                  <SidebarMenuSubButton
                                    onClick={() =>
                                      onMenuButtonClick(submenu.href)
                                    }
                                    className='cursor-pointer'
                                  >
                                    {submenu.icon ? <submenu.icon /> : <Dot />}
                                    {submenu.label}
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </SidebarMenuItem>
                      </Collapsible>
                    )
                  } else {
                    sidebarMenuContent = (
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          onClick={() => onMenuButtonClick(menu.href)}
                        >
                          <menu.icon />
                          {menu.label}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  }

                  return (
                    <SidebarMenu key={menu.href}>
                      {sidebarMenuContent}
                    </SidebarMenu>
                  )
                })}
              </SidebarGroupContent>
            )}
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  )
}
