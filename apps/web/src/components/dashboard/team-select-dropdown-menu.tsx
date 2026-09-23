import { useParams, useRouter } from 'next/navigation'

import { useTranslation } from '@fuku/i18n/react'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@fuku/ui/components'
import { cn } from '@fuku/ui/lib/utils'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckIcon, ChevronsUpDownIcon, PlusIcon, Users2Icon } from 'lucide-react'

import { useTeamStore } from '~/store/team.store'
import { useTRPC } from '~/trpc/client'

export function TeamSelectDropdownMenu() {
  const { t } = useTranslation()
  const params = useParams()
  const username = params.username as string

  const { openTeamSelect, setOpenTeamSelect, activeTeamId, setActiveTeamId }
    = useTeamStore()

  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const router = useRouter()

  const { data: sidebarState } = useQuery({
    ...trpc.user.getSidebarState.queryOptions(),
  })

  const { mutateAsync: setLastActiveTeam } = useMutation({
    ...trpc.user.setLastActiveTeam.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries(trpc.user.getSidebarState.queryOptions())
    },
  })

  const onNewTeam = () => {
    router.push(`/${username}/team/new`)
  }

  const onSelectTeam = async (id: string, slug: string) => {
    if (id === activeTeamId)
      return
    setActiveTeamId(id)
    await setLastActiveTeam({ teamId: id })
    router.push(`/${username}/team/${slug}`)
  }

  return (
    <DropdownMenu open={openTeamSelect} onOpenChange={setOpenTeamSelect}>
      <DropdownMenuTrigger
        asChild
        onPointerDown={(e) => {
          if (sidebarState?.teams.length === 0) {
            e.preventDefault()
          }
        }}

      >
        <Button
          size='lg'
          className={cn(
            !sidebarState?.teams.length
            && 'bg-background hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 border shadow-xs',
            'h-12 w-[14rem] px-4 text-sm has-[>svg]:px-2',
          )}
          onClick={sidebarState?.teams.length === 0
            ? onNewTeam
            : undefined}
          variant='outline'
        >
          {!sidebarState?.activeTeam
            ? (
          // no sidebarState.teams
                <>
                  <div className='flex aspect-square size-8 items-center justify-center rounded-none'>
                    <PlusIcon className='size-4' />
                  </div>
                  <div className='grid flex-1 text-left text-sm leading-tight'>
                    <span className='truncate font-medium'>
                      {t('createYourFirstTeam', 'Create your first team')}
                    </span>
                  </div>
                </>
              )
            : (
          // has sidebarState.teams
                <>
                  <div className='bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-none'>
                    <Users2Icon className='size-4' />
                  </div>
                  <div className='grid flex-1 text-left text-sm leading-tight'>
                    <span className='truncate font-medium'>
                      {sidebarState?.activeTeam?.name}
                    </span>
                    <span className='truncate text-xs'>
                      {sidebarState?.activeTeam?.teamMembers.length}
                      {` ${
                        sidebarState?.activeTeam?.teamMembers.length === 1
                          ? t('memberCount', 'member')
                          : t('membersCount', 'members')}`}
                    </span>
                  </div>
                  <ChevronsUpDownIcon className='ml-auto' />
                </>
              )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className='w-[var(--radix-dropdown-menu-trigger-width)]'
        side='bottom'
      >
        {sidebarState?.teams.map(team => (
          <DropdownMenuItem
            key={team.id}
            onClick={() => onSelectTeam(team.id, team.slug)}
          >
            {team.name}
            {sidebarState?.activeTeam?.id === team.id && (
              <CheckIcon className='ml-auto' />
            )}
          </DropdownMenuItem>
        ))}

        {sidebarState?.teams && sidebarState.teams.length > 1 && (
          <DropdownMenuSeparator />
        )}

        <DropdownMenuItem onClick={onNewTeam}>
          <PlusIcon />
          {' '}
          {t('createANewTeam', 'Create a new team')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
