import { useId, useState } from 'react'
import { ALL_COUNTRIES } from '@fuku/domain/country'
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
import { Check, ChevronsUpDown } from 'lucide-react'
import {
  Control,
  Controller,
  FieldValues,
  Path,
  UseFormResetField,
} from 'react-hook-form'

const COUNTRY_LABELS = Object.fromEntries(
  ALL_COUNTRIES.map(({ code, name }) => [code, name]),
) as Record<string, string>

type CountryControllerProps<T extends FieldValues> = {
  control: Control<T>
  resetField: UseFormResetField<T>
  name?: Path<T>
  disabled?: boolean
}

export function CountryController<T extends FieldValues>({
  control,
  resetField,
  name = 'country' as Path<T>,
  disabled = false,
}: CountryControllerProps<T>) {
  const id = useId()
  const [open, setOpen] = useState(false)

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={id}>Country</FieldLabel>

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
                    COUNTRY_LABELS[field.value]
                  ) : (
                    <span className='text-muted-foreground'>
                      Select country (optional)
                    </span>
                  )}
                </span>

                <ChevronsUpDown
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
              <Command className='max-h-80'>
                <CommandInput
                  placeholder='Search country...'
                  className='border-none rounded-none'
                />

                <CommandList className='max-h-60 overflow-y-auto'>
                  <CommandEmpty>No country found.</CommandEmpty>

                  <CommandGroup>
                    {ALL_COUNTRIES.map(({ code, name }) => (
                      <CommandItem
                        key={code}
                        value={`${code} ${name}`}
                        onSelect={() => {
                          field.onChange(
                            field.value === code ? undefined : code,
                          )

                          setOpen(false)
                        }}
                      >
                        <span className='truncate'>{name}</span>

                        <Check
                          size={16}
                          className={cn(
                            'ml-auto',
                            field.value === code ? 'opacity-100' : 'opacity-0',
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
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
