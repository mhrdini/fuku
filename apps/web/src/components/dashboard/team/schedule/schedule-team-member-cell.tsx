import { useTranslation } from '@fuku/i18n/react'
import {
  Badge,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from '@fuku/ui/components'
import { cn } from '@fuku/ui/lib/utils'

import type { TeamMemberData } from '~/lib/schedule'
import { getTeamMemberTotalEarnings } from '~/lib/team-member'

export function ScheduleTeamMemberCell({
  teamMember,
}: {
  teamMember: TeamMemberData
}) {
  const { t } = useTranslation()
  return (
    <Collapsible className='group/panel border-input flex size-full flex-col not-last:border-b'>
      <CollapsibleTrigger
        className={cn(
          'flex h-[94px] min-h-0 min-w-0 items-center',
          // 'data-[state=closed]:h-full data-[state=open]:h-fit
          // data-[state=open]:flex-shrink-0',
        )}
      >
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
                '{{totalAssignedShifts}} shifts, {{totalAssignedHours}} hours',
                {
                  totalAssignedShifts: teamMember.totalAssignedShifts,
                  totalAssignedHours: teamMember.totalHours,
                },
              )}
            </ItemDescription>
          </ItemContent>
          {teamMember.payGrade && (
            <ItemActions className='group-data-[state=open]/panel:hidden'>
              <Badge variant='secondary'>{teamMember.payGrade.name}</Badge>
            </ItemActions>
          )}
        </Item>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <Item className='grid grid-cols-[auto_1fr] gap-2 pt-0 *:self-center *:text-xs **:justify-self-start *:odd:self-start'>
          <Badge variant='outline'>{t('payGrade', 'Pay Grade')}</Badge>
          <div className='flex items-center gap-2'>
            {teamMember.payGrade
              ? (
                  <>
                    <Badge variant='secondary'>{teamMember.payGrade.name}</Badge>
                    <Badge variant='outline'>{teamMember.payGrade.baseRate}</Badge>
                  </>
                )
              : (
                  '-'
                )}
          </div>
          <Badge variant='outline'>{t('totalEarnings')}</Badge>
          <div className='grid grid-cols-1 gap-1 *:py-0.5'>
            <>{getTeamMemberTotalEarnings(teamMember)}</>
            {/* <div>
              {t(
                'totalAssignedShiftsHours',
                '{{totalAssignedShifts}} shifts, {{totalAssignedHours}} hours',
                {
                  totalAssignedShifts: teamMember.totalAssignedShifts,
                  totalAssignedHours: teamMember.totalHours,
                },
              )}
            </div> */}
          </div>
        </Item>
      </CollapsibleContent>
    </Collapsible>
  )
}
