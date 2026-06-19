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
  Field,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@fuku/ui/components'
import { cn } from '@fuku/ui/lib/utils'
import {
  Check,
  ChevronsUpDown,
  Search,
  SlidersHorizontal,
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

      {/* filter/sort panel popover */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant='secondary' size='icon'>
            <SlidersHorizontal />
          </Button>
        </PopoverTrigger>
        <PopoverContent side='right' align='start'>
          <FieldGroup>
            <FieldSet className='gap-3'>
              <FieldLegend>{t('filter', 'Filter')}</FieldLegend>
              <Field>
                <FieldLabel>{t('byPayGrade', 'By Pay Grade')}</FieldLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id={payGradeFilterId}
                      variant='outline'
                      role='combobox'
                      className='h-auto min-h-8 w-full justify-between hover:bg-transparent'
                    >
                      <div className='flex flex-wrap items-center gap-1 pr-2.5'>
                        {filteredPayGrades.length > 0 ? (
                          filteredPayGrades.map(id => {
                            const pg = payGradeMap.get(id)

                            return pg ? (
                              <Badge
                                key={id}
                                variant='outline'
                                className='rounded-sm'
                              >
                                {pg.name}
                                <Button
                                  variant='ghost'
                                  size='icon'
                                  className='size-4'
                                  onClick={e => {
                                    e.stopPropagation()
                                    removePayGrade(id)
                                  }}
                                  asChild
                                >
                                  <span>
                                    <X className='size-3' />
                                  </span>
                                </Button>
                              </Badge>
                            ) : null
                          })
                        ) : (
                          <span className='text-muted-foreground'>
                            {t('selectPayGrades', 'Select pay grades')}
                          </span>
                        )}
                      </div>
                      <ChevronsUpDown
                        className='text-muted-foreground/80 shrink-0'
                        aria-hidden='true'
                      />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className='w-(--radix-popper-anchor-width) p-0'>
                    <Command>
                      <CommandInput
                        placeholder={t('searchPayGrade', 'Search pay grade...')}
                      />
                      <CommandList>
                        <CommandEmpty>
                          {t('noPayGradeFound', 'No pay grade found.')}
                        </CommandEmpty>
                        <CommandGroup>
                          {payGrades?.map(pg => (
                            <CommandItem
                              key={pg.id}
                              value={pg.id}
                              onSelect={() => togglePayGrade(pg.id)}
                            >
                              <span className='truncate'>{pg.name}</span>
                              {filteredPayGrades.includes(pg.id) && (
                                <Check size={16} className='ml-auto' />
                              )}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </Field>
            </FieldSet>
          </FieldGroup>
        </PopoverContent>
      </Popover>
    </div>
  )
}
