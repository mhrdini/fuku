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
} from '@fuku/ui/components'
import { cn } from '@fuku/ui/lib/utils'
import {
  BadgeDollarSignIcon,
  Check,
  Search,
  Settings2Icon,
  X,
} from 'lucide-react'

import { ScheduleFilters } from '~/hooks/schedule/useScheduleFilters'

interface ScheduleTeamMemberHeaderCellProps {
  data: {
    payGrades: PayGradeOutput[] | undefined
  }
  filters: ScheduleFilters
  derivedData: {
    payGradeMap: Map<string, PayGradeOutput>
  }
}

export const ScheduleTeamMemberHeaderCell = ({
  data: { payGrades },
  filters: {
    search,
    setSearch,
    payGradeFilterId,
    filteredPayGrades,
    resetFilteredPayGrades,
    togglePayGrade,
    removePayGrade,
  },
  derivedData: { payGradeMap },
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
                          {filteredPayGrades.includes(pg.id) && (
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
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
