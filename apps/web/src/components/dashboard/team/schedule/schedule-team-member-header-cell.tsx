import { useCallback } from 'react'

import { useTranslation } from '@fuku/i18n/react'
import {
  Badge,
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  ScrollArea,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
} from '@fuku/ui/components'
import { cn } from '@fuku/ui/lib/utils'
import {
  ArrowDownNarrowWideIcon,
  ArrowUpWideNarrowIcon,
  BadgeDollarSignIcon,
  CheckIcon,
  SearchIcon,
  Settings2Icon,
  XIcon,
} from 'lucide-react'

import type { PayGradeOutput } from '@fuku/api/schemas'

import type { ScheduleFilters } from '~/hooks/schedule/use-schedule-filters'
import type { TeamMemberGroupBySort } from '~/hooks/schedule/use-team-member-group-by-sort'
import { preventCloseOnSelect } from '~/lib/event'
import type {
  TeamMemberGroupByKey,
  TeamMemberSortKey,
} from '~/lib/team-member'
import {
  TEAM_MEMBER_GROUP_BY_KEYS,
  TEAM_MEMBER_SORT_KEYS,
} from '~/lib/team-member'

type ScheduleTeamMemberHeaderCellProps = {
  data: {
    payGrades: PayGradeOutput[] | undefined
  }
  filters: ScheduleFilters
  derivedData: {
    payGradeMap: Map<string, PayGradeOutput>
  }
  teamMemberGroupBySort: TeamMemberGroupBySort
}

export function ScheduleTeamMemberHeaderCell({
  data: { payGrades },
  filters: {
    search,
    setSearch,
    filteredPayGrades,
    resetFilteredPayGrades,
    togglePayGrade,
  },
  teamMemberGroupBySort: {
    groupByKey,
    setGroupByKey,
    sortKey,
    setSortKey,
    direction,
    toggleDirection,
    reset: resetGroupBySort,
  },
}: ScheduleTeamMemberHeaderCellProps) {
  const { t } = useTranslation()

  const resetAll = useCallback(() => {
    resetFilteredPayGrades()
    resetGroupBySort()
  }, [resetFilteredPayGrades, resetGroupBySort])

  return (
    <div className='border-input bg-background sticky top-0 left-0 z-40 flex items-center gap-2 border-r border-b p-2'>
      <InputGroup className='bg-input/30 flex-1'>
        <InputGroupAddon>
          <SearchIcon className='size-4 shrink-0 opacity-50' />
        </InputGroupAddon>

        <InputGroupInput
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t('search', 'Search')}
        />
        <InputGroupAddon align='inline-end' className={cn(!search && 'hidden')}>
          <InputGroupButton
            size='icon-xs'
            variant='ghost'
            onClick={() => setSearch('')}
          >
            <XIcon />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='secondary' size='icon-lg'>
            <Settings2Icon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>{t('filterBy', 'Filter by')}</DropdownMenuLabel>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <BadgeDollarSignIcon />
              {t('payGrade', 'Pay Grade')}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <Command>
                <CommandInput placeholder={t('searchPayGrade')} />
                <CommandList>
                  <ScrollArea
                  // className='max-h-48'
                  >
                    <CommandEmpty className='text-muted-foreground p-4 text-xs'>
                      {t('noPayGradesFound')}
                    </CommandEmpty>
                    <CommandGroup>
                      {payGrades?.map(pg => (
                        <CommandItem
                          key={pg.id}
                          value={pg.id}
                          onSelect={() => togglePayGrade(pg.id)}
                        >
                          <Badge variant='outline'>{pg.name}</Badge>
                          {filteredPayGrades.has(pg.id) && (
                            <CheckIcon size={16} className='ml-auto' />
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </ScrollArea>
                </CommandList>
                <CommandSeparator />
                <Button
                  onClick={resetFilteredPayGrades}
                  variant='ghost'
                  className='text-muted-foreground'
                >
                  {t('clearAll')}
                </Button>
              </Command>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <Separator />
          <DropdownMenuGroup className='*:*:odd:text-muted-foreground grid grid-cols-2 gap-2 p-2 *:col-span-2 *:grid *:grid-cols-subgrid *:items-center *:p-0 *:*:even:w-full *:*:even:min-w-0 *:*:even:flex-1'>
            <DropdownMenuItem noHighlight onSelect={preventCloseOnSelect}>
              <div>{t('grouping')}</div>
              <Select
                value={groupByKey ?? 'undefined'}
                onValueChange={value =>
                  value === 'undefined'
                    ? setGroupByKey(undefined)
                    : setGroupByKey(value as TeamMemberGroupByKey)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value='undefined'>
                      {t('noGrouping', 'No grouping')}
                    </SelectItem>
                    {TEAM_MEMBER_GROUP_BY_KEYS.map(groupByKey => (
                      <SelectItem key={groupByKey} value={groupByKey}>
                        {t(groupByKey)}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </DropdownMenuItem>
            <DropdownMenuItem noHighlight onSelect={preventCloseOnSelect}>
              <div className='flex items-center justify-between gap-2'>
                <div>{t('sorting')}</div>
                <Button
                  hidden={sortKey === undefined}
                  variant='ghost'
                  size='icon-sm'
                  onClick={toggleDirection}
                >
                  <ArrowDownNarrowWideIcon
                    className={cn(
                      'hidden',
                      sortKey && direction === 'asc' && 'flex',
                    )}
                  />
                  <ArrowUpWideNarrowIcon
                    className={cn(
                      'hidden',
                      sortKey && direction === 'desc' && 'flex',
                    )}
                  />
                </Button>
              </div>
              <Select
                value={sortKey ?? 'undefined'}
                onValueChange={value =>
                  value === 'undefined'
                    ? setSortKey(undefined)
                    : setSortKey(value as TeamMemberSortKey)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value='undefined'>
                      {t('created', 'Created')}
                    </SelectItem>
                    {TEAM_MEMBER_SORT_KEYS.map(sortKey => (
                      <SelectItem key={sortKey} value={sortKey}>
                        {t(sortKey)}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <div className='*:text-muted-foreground flex w-full items-center justify-between gap-2 p-2 text-xs'>
            <div>{t('reset')}</div>
            <div className='flex items-center gap-1'>
              <Button variant='link' size='xs' onClick={resetFilteredPayGrades}>
                {t('filters')}
              </Button>
              <Button variant='link' size='xs' onClick={resetGroupBySort}>
                {t('groupSort')}
              </Button>
              <Button variant='link' size='xs' onClick={resetAll}>
                {t('all')}
              </Button>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
