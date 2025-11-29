'use client'

import React, { useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  Skeleton,
} from '@fuku/ui/components'
import { useSuspenseQuery } from '@tanstack/react-query'
import { ChevronRight, ChevronsUpDown, Dot, Plus, Users2 } from 'lucide-react'

import { useMenu } from '~/lib/menu'
import { useDashboardStore } from '~/store/dashboard'
import { useTRPC } from '~/trpc/client'

export const DashboardSidebar = ({ username }: { username: string }) => {
  const trpc = useTRPC()

  const { data: teams, isPending: isLoadingTeams } = useSuspenseQuery(
    trpc.team.getAllOwned.queryOptions(),
  )
  const { currentTeamSlug, setCurrentTeam } = useDashboardStore()

  useEffect(() => {
    if (teams?.length && !currentTeamSlug) {
      setCurrentTeam({ id: teams[0].id, slug: teams[0].slug })
    }
  }, [teams, currentTeamSlug, setCurrentTeam])

  const router = useRouter()
  const groups = useMenu()

  const onMenuButtonClick = useCallback(
    (url: string) => {
      router.push('/' + username + url)
    },
    [username],
  )

  const loadingTeamsHeader = <Skeleton />

  const noTeamsHeader = (
    <SidebarMenuButton
      className='border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50'
      size='lg'
    >
      <div className='flex aspect-square size-8 items-center justify-center rounded-lg'>
        <Plus className='size-4' />
      </div>
      <div className='grid flex-1 text-left text-sm leading-tight'>
        <span className='truncate font-medium'>Create your first team</span>
      </div>
    </SidebarMenuButton>
  )

  const hasTeamsHeader = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {teams[0] && (
          <SidebarMenuButton size='lg'>
            <div className='bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg'>
              <Users2 className='size-4' />
            </div>
            <div className='grid flex-1 text-left text-sm leading-tight'>
              <span className='truncate font-medium'>{teams[0].name}</span>
              <span className='truncate text-xs'>
                {teams[0].teamMembers.length} members
              </span>
            </div>
            <ChevronsUpDown className='ml-auto' />
          </SidebarMenuButton>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className='w-[var(--radix-dropdown-menu-trigger-width)]'
        side='bottom'
      >
        {teams.slice(1).map(team => (
          <DropdownMenuItem>
            <span>{team.name}</span>
          </DropdownMenuItem>
        ))}
        {teams.slice(1).length > 0 && <DropdownMenuSeparator />}
        <DropdownMenuItem>
          <Plus /> Create new team
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <Sidebar collapsible='icon'>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            {isLoadingTeams
              ? loadingTeamsHeader
              : teams && teams.length > 0
                ? hasTeamsHeader
                : noTeamsHeader}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {teams.length > 0 &&
          currentTeamSlug &&
          groups.map(group => (
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
                                <ChevronRight className='ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90' />
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
                                      {submenu.icon ? (
                                        <submenu.icon />
                                      ) : (
                                        <Dot />
                                      )}
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
                              className='transition-transform group-data-[state=open]/collapsible:rotate-90'
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
                                      {submenu.icon ? (
                                        <submenu.icon />
                                      ) : (
                                        <Dot />
                                      )}
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
