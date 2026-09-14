import { useTranslation } from '@fuku/i18n/react'
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

import { TeamMemberData } from '~/lib/schedule'

export const ScheduleTeamMemberCell = ({
  teamMember,
}: {
  teamMember: TeamMemberData
}) => {
  const { t } = useTranslation()
  return (
    <Collapsible className='group/panel flex flex-col size-full not-last:border-b border-input'>
      <CollapsibleTrigger className='flex min-h-0 min-w-0 items-center h-full'>
        <Item className='size-full'>
          <ItemContent className='items-start'>
            <ItemTitle>
              <span>
                {t('givennamesFamilyname', {
                  givenNames: teamMember.givenNames,
                  familyName: teamMember.familyName,
                })}
              </span>
            </ItemTitle>
            <ItemDescription
            // className='group-data-[state=open]/panel:hidden'
            >
              {t(
                'totalAssignedShiftsHours',
                '{{totalAssignedShifts}} shifts, {{totalHours}} hours',
                {
                  totalAssignedShifts: teamMember.totalAssignedShifts,
                  totalHours: teamMember.totalHours,
                },
              )}
            </ItemDescription>
          </ItemContent>
        </Item>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <Item className='*:text-xs pt-0 grid grid-cols-[auto_1fr] gap-2 **:justify-self-start *:self-center *:odd:self-start'>
          <Badge variant='outline'>{t('payGrade', 'Pay Grade')}</Badge>
          <div>{teamMember.payGrade?.name}</div>
          <Badge variant='outline'>{t('shiftHours', 'Shift Hours')}</Badge>
          <div className='grid gap-1 grid-flow-col'>
            <div>
              {t('totalHours', '{{totalHours}} hours', {
                totalHours: teamMember.totalHours,
              })}
            </div>
            <div>
              (
              {teamMember.totalHours *
                (teamMember.payGrade ? teamMember.payGrade.baseRate : 0)}
              )
            </div>
          </div>
        </Item>
      </CollapsibleContent>
    </Collapsible>
  )
}
