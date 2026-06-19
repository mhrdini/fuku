import { useId, useMemo, useState } from 'react'
import { useTranslation } from '@fuku/i18n/react'
import {
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Field,
  FieldError,
  FieldLabel,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@fuku/ui/components'
import { cn } from '@fuku/ui/lib/utils'
import { CheckIcon, ChevronsUpDownIcon } from 'lucide-react'
import {
  Control,
  Controller,
  FieldValues,
  Path,
  UseFormResetField,
} from 'react-hook-form'

import { getGroupedTimeZones, TimeZoneOption } from '~/lib/date'

const GROUPED_TIMEZONES = getGroupedTimeZones()

const TIMEZONE_LABELS = Object.fromEntries(
  Object.values(GROUPED_TIMEZONES)
    .flat()
    .map(zone => [zone.value, zone.label]),
) as Record<string, string>

type TimeZoneControllerProps<T extends FieldValues> = {
  control: Control<T>
  resetField: UseFormResetField<T>
  name?: Path<T>
  disabled?: boolean
}

export function TimeZoneController<T extends FieldValues>({
  control,
  resetField,
  name = 'timeZone' as Path<T>,
  disabled = false,
}: TimeZoneControllerProps<T>) {
  const { t } = useTranslation()
  const id = useId()

  const [open, setOpen] = useState(false)

  const groupedTimeZones = useMemo(
    () => Object.entries(getGroupedTimeZones()),
    [],
  )

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={id}>{t('timeZone', 'Time Zone')}</FieldLabel>

          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                id={id}
                type='button'
                variant='outline'
                role='combobox'
                disabled={disabled}
                aria-expanded={open}
                className='w-full justify-between'
              >
                <span className='truncate'>
                  {field.value ? (
                    TIMEZONE_LABELS[field.value]
                  ) : (
                    <span className='text-muted-foreground'>
                      {t('selectTimezone', 'Select timezone')}
                    </span>
                  )}
                </span>

                <ChevronsUpDownIcon
                  className='text-muted-foreground/80 shrink-0'
                  aria-hidden='true'
                />
              </Button>
            </PopoverTrigger>

            <PopoverContent
              align='start'
              side='bottom'
              sideOffset={4}
              className='w-(--radix-popper-anchor-width) p-0'
            >
              <Command>
                <CommandInput
                  className='border-none rounded-none'
                  placeholder={t('searchTimezone', 'Search timezone...')}
                  onKeyDown={e => {
                    if (e.key === 'Escape') {
                      resetField(name)
                      setOpen(false)
                    }
                  }}
                />

                <CommandList className='max-h-60 overflow-y-auto'>
                  <CommandEmpty>
                    {t('noTimezoneFound', 'No timezone found.')}
                  </CommandEmpty>

                  {groupedTimeZones.map(([region, zones]) => (
                    <CommandGroup key={region} heading={region}>
                      {zones.map((zone: TimeZoneOption) => (
                        <CommandItem
                          key={zone.value}
                          value={t(
                            'valueLabelOffset',
                            '{{value}} {{label}} {{offset}}',
                            {
                              value: zone.value,
                              label: zone.label,
                              offset: zone.offset,
                            },
                          )}
                          onSelect={() => {
                            field.onChange(
                              field.value === zone.value
                                ? undefined
                                : zone.value,
                            )

                            setOpen(false)
                          }}
                          className='gap-2'
                        >
                          <span className='text-muted-foreground text-xs shrink-0'>
                            {zone.offset}
                          </span>

                          <span className='truncate flex-1'>{zone.label}</span>

                          <CheckIcon
                            size={16}
                            className={cn(
                              'ml-auto shrink-0',
                              field.value === zone.value
                                ? 'opacity-100'
                                : 'opacity-0',
                            )}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  ))}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  )
}
