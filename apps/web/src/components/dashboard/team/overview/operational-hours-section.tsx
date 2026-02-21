import { useEffect } from 'react'
import {
  OperationalHourOutput,
  OperationalHourOutputSchema,
} from '@fuku/api/schemas'
import { DayOfWeekKey } from '@fuku/db/schemas'
import {
  Button,
  Checkbox,
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
  Item,
  ItemActions,
  ItemContent,
  ItemTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@fuku/ui/components'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  Controller,
  SubmitErrorHandler,
  SubmitHandler,
  useForm,
} from 'react-hook-form'
import { toast } from 'sonner'

import { TIME_OPTIONS, WEEKDAY_MAP } from '~/lib/date'
import { useTRPC } from '~/trpc/client'

export function OperationalHoursSection({ teamId }: { teamId: string }) {
  const trpc = useTRPC()

  const { data: operationalHours, isSuccess } = useQuery({
    ...trpc.operationalHour.list.queryOptions({ teamId }),
    enabled: !!teamId,
  })

  const { mutateAsync: setHours } = useMutation({
    ...trpc.operationalHour.setHours.mutationOptions(),
    onSuccess: () => {
      form.reset(form.getValues())
      toast.success('Operational Hours', {
        description: 'Changes saved!',
      })
    },
    onError: error => {
      toast.error('Operational Hours', {
        description: error.message,
      })
    },
  })

  const createDefaultDay = () => ({
    teamId,
    startTime: undefined as string | undefined,
    endTime: undefined as string | undefined,
    deletedAt: new Date() as Date | null,
  })

  const form = useForm<OperationalHourOutput>({
    defaultValues: {
      1: createDefaultDay(),
      2: createDefaultDay(),
      3: createDefaultDay(),
      4: createDefaultDay(),
      5: createDefaultDay(),
      6: createDefaultDay(),
      7: createDefaultDay(),
      ...operationalHours,
    },
    resolver: zodResolver(OperationalHourOutputSchema),
  })

  const resetForm = () => {
    if (operationalHours) {
      form.reset(operationalHours, {
        keepDirtyValues: false,
        keepDirty: false,
      })
    }
  }

  useEffect(() => {
    const full = {
      1: createDefaultDay(),
      2: createDefaultDay(),
      3: createDefaultDay(),
      4: createDefaultDay(),
      5: createDefaultDay(),
      6: createDefaultDay(),
      7: createDefaultDay(),
    }

    if (operationalHours) {
      for (const day of Object.keys(operationalHours) as DayOfWeekKey[]) {
        full[day] = {
          ...createDefaultDay(),
          ...operationalHours[day],
        }
      }
    }

    form.reset(full)
  }, [operationalHours])

  const onSubmit: SubmitHandler<OperationalHourOutput> = async values => {
    // console.log('Form values on submit:', values)

    try {
      const dirtyFields = form.formState.dirtyFields

      // Extract days where ANY nested field changed
      const dirtyDays = Object.keys(dirtyFields).filter(day => {
        const value = dirtyFields[day as keyof typeof dirtyFields]
        return value && Object.keys(value as object).length > 0
      }) as DayOfWeekKey[]

      if (dirtyDays.length === 0) {
        form.setError('root', {
          type: 'manual',
          message: 'There are no changes to save.',
        })
        return
      }

      const hours = dirtyDays.reduce((acc, day) => {
        acc[day] = values[day]
        return acc
      }, {} as OperationalHourOutput)

      // console.log('Submitting hours:', hours)
      await setHours({ teamId, hours })
    } catch {
      // handled in mutation onError
    }
  }

  const onError: SubmitErrorHandler<OperationalHourOutput> = errors => {
    console.log('Form errors:', errors)
    console.log('Form values on error:', form.getValues())
  }

  return (
    <div className='flex flex-col gap-4'>
      <h2>Operational Hours</h2>

      <form
        onSubmit={form.handleSubmit(onSubmit, onError)}
        className='flex flex-col gap-2'
      >
        {(Object.keys(WEEKDAY_MAP) as DayOfWeekKey[]).map(day => {
          const weekday = WEEKDAY_MAP[day]
          return (
            <Item size='xs' key={day} className='flex items-center gap-4'>
              <ItemContent>
                <ItemTitle>{weekday}</ItemTitle>

                <ItemActions className='*:w-24 gap-4'>
                  {/* CLOSED CHECKBOX */}
                  <Controller
                    control={form.control}
                    name={`${day}.deletedAt`}
                    render={({ field }) => (
                      <Field orientation='horizontal'>
                        <Checkbox
                          {...field}
                          value={field.value ? 'open' : 'closed'}
                          name={`closed-${day}`}
                          disabled={!isSuccess}
                          checked={!!field.value}
                          onCheckedChange={checked =>
                            field.onChange(checked ? new Date() : null)
                          }
                        />
                        <FieldContent>
                          <FieldLabel htmlFor={`closed-${day}`}>
                            Closed
                          </FieldLabel>
                        </FieldContent>
                      </Field>
                    )}
                  />

                  {/* START TIME */}
                  <Controller
                    control={form.control}
                    name={`${day}.startTime`}
                    render={({ field }) => (
                      <Field orientation='horizontal'>
                        <FieldLabel className='sr-only'>Start Time</FieldLabel>
                        <Select
                          {...field}
                          value={field.value ?? ''}
                          onValueChange={field.onChange}
                          disabled={
                            !isSuccess ||
                            form.watch(`${day}.deletedAt`) !== null
                          }
                        >
                          <SelectTrigger className='w-full max-w-24'>
                            <SelectValue placeholder='-' />
                          </SelectTrigger>
                          <SelectContent className='w-full max-w-24'>
                            {TIME_OPTIONS.map(time => (
                              <SelectItem key={time} value={time}>
                                {time}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                    )}
                  />

                  {/* END TIME */}
                  <Controller
                    control={form.control}
                    name={`${day}.endTime`}
                    render={({ field }) => (
                      <Field orientation='horizontal'>
                        <FieldLabel className='sr-only'>End Time</FieldLabel>
                        <Select
                          {...field}
                          value={field.value ?? ''}
                          onValueChange={field.onChange}
                          disabled={
                            !isSuccess ||
                            form.watch(`${day}.deletedAt`) !== null
                          }
                        >
                          <SelectTrigger className='w-full max-w-24'>
                            <SelectValue placeholder='-' />
                          </SelectTrigger>
                          <SelectContent className='w-full max-w-24'>
                            {TIME_OPTIONS.map(time => (
                              <SelectItem key={time} value={time}>
                                {time}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                    )}
                  />
                </ItemActions>
              </ItemContent>
            </Item>
          )
        })}

        <Field orientation='horizontal' className='gap-4 last:mt-2'>
          <Button type='submit' disabled={!isSuccess}>
            Save Changes
          </Button>

          <Button
            type='button'
            disabled={!isSuccess}
            onClick={resetForm}
            variant='outline'
          >
            Reset
          </Button>

          <FieldError>{form.formState.errors.root?.message}</FieldError>
        </Field>
      </form>
    </div>
  )
}
