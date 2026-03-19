import {
  Badge,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from '@fuku/ui/components'
import { cn } from '@fuku/ui/lib/utils'

import { TeamMemberData } from '~/lib/schedule'

export const ScheduleTeamMemberCell = ({
  teamMember,
}: {
  teamMember: TeamMemberData
}) => {
  return (
    <Collapsible className='group/panel not-last:border-b border-input'>
      <CollapsibleTrigger className='w-full flex items-center min-h-16 px-2'>
        <Item className='size-full py-0 px-2'>
          <ItemContent className='items-start'>
            <ItemTitle>
              <span>{teamMember.givenNames}</span>
              <span
                className={cn(teamMember.familyName ? 'inline-flex' : 'hidden')}
              >
                {' '}
                {teamMember.familyName}
              </span>
            </ItemTitle>
            <ItemDescription className='group-data-[state=open]/panel:hidden'>
              {teamMember.totalAssignedShifts} shifts, {teamMember.totalHours}{' '}
              hours
            </ItemDescription>
          </ItemContent>
        </Item>
      </CollapsibleTrigger>
      <CollapsibleContent className='p-1.5 px-2'>
        <div className='*:text-sm grid grid-cols-[auto_1fr] gap-2 **:justify-self-start *:self-center *:odd:self-start'>
          <Badge variant='outline'>Pay Grade</Badge>
          <div>{teamMember.payGrade?.name}</div>
          <Badge variant='outline'>Shift Hours</Badge>
          <div className='grid grid-flow-row'>
            <div>{teamMember.totalHours} hours</div>
            <div>
              {teamMember.totalHours *
                (teamMember.payGrade ? teamMember.payGrade.baseRate : 0)}
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
