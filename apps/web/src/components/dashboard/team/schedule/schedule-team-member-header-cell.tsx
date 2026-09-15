import { PayGradeOutput } from '@fuku/api/schemas'
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
  Check,
  Search,
  Settings2Icon,
  X,
} from 'lucide-react'

import { TeamMemberGroupBySort } from '~/hooks/schedule/use-team-member-group-by-sort'
import { ScheduleFilters } from '~/hooks/schedule/useScheduleFilters'
import { preventCloseOnSelect } from '~/lib/event'
import {
  TEAM_MEMBER_GROUP_BY_KEYS,
  TEAM_MEMBER_SORT_KEYS,
  TeamMemberGroupByKey,
  TeamMemberSortKey,
} from '~/lib/team-member'

interface ScheduleTeamMemberHeaderCellProps {
  data: {
    payGrades: PayGradeOutput[] | undefined
  }
  filters: ScheduleFilters
  derivedData: {
    payGradeMap: Map<string, PayGradeOutput>
  }
  teamMemberGroupBySort: TeamMemberGroupBySort
}

export const ScheduleTeamMemberHeaderCell = ({
  data: { payGrades },
  filters: {
    search,
    setSearch,
    filteredPayGrades,
    resetFilteredPayGrades,
    togglePayGrade,
  },
  derivedData: { payGradeMap },
  teamMemberGroupBySort: {
    groupByKey,
    setGroupByKey,
    sortKey,
    setSortKey,
    direction,
    toggleDirection,
    reset,
  },
}: ScheduleTeamMemberHeaderCellProps) => {
  const { t } = useTranslation()
  return (
    <div className='sticky left-0 top-0 z-40 p-2 border-b border-r border-input bg-background flex items-center gap-2'>
      <InputGroup className='flex-1 bg-input/30'>
        <InputGroupAddon>
          <Search className='size-4 shrink-0 opacity-50' />
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
            <X />
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
                    <CommandEmpty className='text-xs text-muted-foreground p-4'>
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
                            <Check size={16} className='ml-auto' />
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
          <DropdownMenuGroup className='*:p-0 p-2 grid grid-cols-2 gap-2 *:grid *:grid-cols-subgrid *:col-span-2 *:items-center *:*:odd:text-muted-foreground *:*:even:min-w-0 *:*:even:flex-1 *:*:even:w-full'>
            <DropdownMenuItem noHighlight onSelect={preventCloseOnSelect}>
              <div>{t('grouping')}</div>
              <Select
                value={groupByKey ?? 'undefined'}
                onValueChange={value =>
                  value === 'undefined'
                    ? setGroupByKey(undefined)
                    : setGroupByKey(value as TeamMemberGroupByKey)
                }
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
              <div className='flex gap-2 items-center justify-between'>
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
                    : setSortKey(value as TeamMemberSortKey)
                }
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
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
