'use client'

import { useCallback } from 'react'
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
import { cn } from '@fuku/ui/lib/utils'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Check,
  ChevronRight,
  ChevronsUpDown,
  Dot,
  Plus,
  Users2,
} from 'lucide-react'

import { useMenu } from '~/lib/menu'
import { useTeamStore } from '~/store/team.store'
import { useTRPC } from '~/trpc/client'

export const DashboardSidebar = ({ username }: { username: string }) => {
  const { openTeamSelect, setOpenTeamSelect, activeTeamId, setActiveTeamId } =
    useTeamStore()

  const queryClient = useQueryClient()
  const trpc = useTRPC()

  const { data: sidebarState } = useQuery({
    ...trpc.user.getSidebarState.queryOptions(),
  })

  const { mutateAsync: setLastActiveTeam } = useMutation({
    ...trpc.user.setLastActiveTeam.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries(trpc.user.getSidebarState.queryOptions())
    },
  })

  const router = useRouter()
  const menuGroups = useMenu(sidebarState ? sidebarState.activeTeam : null)

  const onMenuButtonClick = useCallback(
    (url: string) => {
      router.push('/' + username + url)
    },
    [username],
  )

  const onNewTeam = () => {
    router.push(`/${username}/team/new`)
  }

  const onSelectTeam = async (id: string, slug: string) => {
    setActiveTeamId(id)
    await setLastActiveTeam({ teamId: id })
    router.push(`/${username}/team/${slug}`)
  }

  const teamsHeader =
    sidebarState === undefined ? (
      <>
        <div className='flex aspect-square size-8 items-center justify-center rounded-lg bg-muted'>
          <Skeleton className='size-4 rounded' />
        </div>
        <div className='grid flex-1 gap-1'>
          <Skeleton className='h-3 w-24' />
          <Skeleton className='h-2 w-16' />
        </div>
      </>
    ) : (
      <DropdownMenu open={openTeamSelect} onOpenChange={setOpenTeamSelect}>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton
            size='lg'
            className={cn(
              !sidebarState.teams?.length &&
                'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50',
            )}
            onClick={!sidebarState.teams?.length ? onNewTeam : undefined}
          >
            {!sidebarState.activeTeam ? (
              // no sidebarState.teams
              <>
                <div className='flex aspect-square size-8 items-center justify-center rounded-lg'>
                  <Plus className='size-4' />
                </div>
                <div className='grid flex-1 text-left text-sm leading-tight'>
                  <span className='truncate font-medium'>
                    Create your first team
                  </span>
                </div>
              </>
            ) : (
              // has sidebarState.teams
              <>
                <div className='bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg'>
                  <Users2 className='size-4' />
                </div>
                <div className='grid flex-1 text-left text-sm leading-tight'>
                  <span className='truncate font-medium'>
                    {sidebarState.activeTeam.name}
                  </span>
                  <span className='truncate text-xs'>
                    {sidebarState.activeTeam.teamMembers.length}
                    {' ' +
                      (sidebarState.activeTeam.teamMembers.length === 1
                        ? 'member'
                        : 'members')}
                  </span>
                </div>
                <ChevronsUpDown className='ml-auto' />
              </>
            )}
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        {sidebarState.teams.length > 0 && (
          <DropdownMenuContent
            className='w-[var(--radix-dropdown-menu-trigger-width)]'
            side='bottom'
          >
            {sidebarState.teams.map(team => (
              <DropdownMenuItem
                key={team.id}
                onClick={() => onSelectTeam(team.id, team.slug)}
              >
                {team.name}
                {sidebarState.activeTeam?.id === team.id && (
                  <Check className='ml-auto' />
                )}
              </DropdownMenuItem>
            ))}

            {sidebarState.teams.length > 1 && <DropdownMenuSeparator />}

            <DropdownMenuItem onClick={onNewTeam}>
              <Plus /> Create a new team
            </DropdownMenuItem>
          </DropdownMenuContent>
        )}
      </DropdownMenu>
    )

  return (
    <Sidebar collapsible='icon'>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>{teamsHeader}</SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {sidebarState &&
          sidebarState.teams &&
          sidebarState.teams.length > 0 &&
          sidebarState.activeTeam &&
          menuGroups.map(group => (
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
