import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxSeparator,
  Field,
  FieldLabel,
  ItemContent,
  ItemDescription,
} from '@fuku/ui/components'
import {
  Control,
  Controller,
  FieldValues,
  Path,
  UseFormResetField,
} from 'react-hook-form'

import { getGroupedTimeZones, TimeZoneOption } from '~/lib/date'

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
  const groupedTimeZones = getGroupedTimeZones()

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel>Time Zone</FieldLabel>
          <Combobox
            disabled={disabled}
            value={field.value}
            onValueChange={field.onChange}
            items={Object.entries(groupedTimeZones).flatMap(
              ([region, zones]) =>
                [
                  {
                    value: region,
                    items: zones,
                  },
                ] as const,
            )}
          >
            <ComboboxInput
              onKeyDown={e => {
                if (e.key === 'Escape') {
                  resetField('timeZone' as Path<T>)
                }
              }}
              placeholder='Search timezones...'
            />

            <ComboboxContent>
              <ComboboxList>
                {group => (
                  <div key={group.value} className='group'>
                    <ComboboxGroup items={group.items as TimeZoneOption[]}>
                      <ComboboxLabel>{group.value}</ComboboxLabel>
                      <ComboboxCollection>
                        {(item: TimeZoneOption) => (
                          <ComboboxItem key={item.value} value={item.value}>
                            <ItemDescription className='text-muted-foreground'>
                              {item.offset}
                            </ItemDescription>
                            <ItemContent>{item.label}</ItemContent>
                          </ComboboxItem>
                        )}
                      </ComboboxCollection>
                    </ComboboxGroup>
                    <ComboboxSeparator className='group-last:hidden' />
                  </div>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </Field>
      )}
    />
  )
}
