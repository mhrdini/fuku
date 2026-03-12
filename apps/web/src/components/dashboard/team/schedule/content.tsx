'use client'

import { useParams } from 'next/navigation'
import { TeamMemberOutput } from '@fuku/api/schemas'
import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Command,
  CommandInput,
  CommandItem,
  CommandList,
  DateRangePicker,
  Item,
  ItemTitle,
  Separator,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@fuku/ui/components'
import { cn } from '@fuku/ui/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { Check, Cog, Plus, RefreshCcw, SlidersHorizontal } from 'lucide-react'

import { useTRPC } from '~/trpc/client'

export const TeamScheduleContent = () => {
  const trpc = useTRPC()
  const params = useParams()
  const slug = params?.slug as string

  const { data: team } = useQuery({
    ...trpc.team.bySlug.queryOptions({ slug: slug! }),
    enabled: !!slug,
  })

  const { data: teamMembers } = useQuery({
    ...trpc.teamMember.listDetailed.queryOptions({ teamId: team!.id }),
    enabled: !!team,
  })

  return (
    <div className='flex flex-col gap-6'>
      <h2>Schedule</h2>
      {/* header */}
      <div className='flex gap-2'>
        <DateRangePicker
          align='start'
          variant='secondary'
          showCompare={false}
        />
        <Button className='ml-auto'>
          <RefreshCcw />
          <span className='hidden md:flex'>Auto-Schedule</span>
        </Button>
        <Button variant='secondary'>
          <Cog />
          <span className='hidden md:flex'>Customize</span>
        </Button>
      </div>
      {/* xs breakpoint */}
      <div className='flex sm:hidden'></div>
      {/* sm breakpoint */}
      <div className='hidden sm:flex md:hidden'></div>
      {/* md+ breakpoint */}
      <div className='h-[600px] hidden md:grid grid-flow-col grid-cols-[300px_auto] border rounded-md border-input'>
        {/* panel */}
        <Tabs
          defaultValue='members'
          className='flex flex-col min-h-0 rounded-l-md gap-0 border-r border-input'
        >
          {/* panel tabs */}
          <div className='w-full p-2'>
            <TabsList className='w-full'>
              <TabsTrigger value='members'>Members</TabsTrigger>
              <TabsTrigger value='rules'>Rules</TabsTrigger>
            </TabsList>
          </div>
          <Separator className='border-input' />
          {/* members panel content */}
          <TabsContent value='members' className='flex flex-col flex-1 min-h-0'>
            <Command className='bg-none border-none rounded-none p-0'>
              <div className='p-2 border-b border-input flex items-center gap-2'>
                <CommandInput placeholder='Search' className='flex-1' />
                <Button variant='secondary' size='icon'>
                  <SlidersHorizontal />
                </Button>
              </div>
              <CommandList className='flex-1 min-h-0 h-full'>
                {teamMembers &&
                  teamMembers.map(tm => (
                    <TeamMemberPanelItem key={tm.id} teamMember={tm} />
                  ))}
              </CommandList>
            </Command>
            <div className='p-2 border-t border-input'>
              <Button className='w-full' variant='secondary'>
                <Plus /> Add Member
              </Button>
            </div>
          </TabsContent>
          {/* rules panel content */}
          <TabsContent value='rules'>Rules</TabsContent>
        </Tabs>
        {/* calendar */}
        <div>calendar</div>
      </div>
      <div className='flex gap-2 justify-end'>
        <Button disabled>
          Save
          <Check />
        </Button>
      </div>
    </div>
  )
}

const TeamMemberPanelItem = ({
  teamMember,
}: {
  teamMember: TeamMemberOutput
}) => {
  return (
    <CommandItem
      value={
        teamMember.givenNames +
        (teamMember.familyName ? ' ' + teamMember.familyName : '')
      }
      noDefaultStyles
      className='not-last:border-b border-input'
    >
      <Collapsible>
        <CollapsibleTrigger className='w-full flex items-center justify-start'>
          <Item>
            <ItemTitle>
              <span>{teamMember.givenNames}</span>
              <span
                className={cn(teamMember.familyName ? 'inline-flex' : 'hidden')}
              >
                {' '}
                {teamMember.familyName}
              </span>
            </ItemTitle>
          </Item>
        </CollapsibleTrigger>
        <CollapsibleContent>{teamMember.payGrade?.name}</CollapsibleContent>
      </Collapsible>
    </CommandItem>
  )
}
