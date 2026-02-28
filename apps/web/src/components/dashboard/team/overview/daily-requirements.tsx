import { useEffect } from 'react'
import {
  OperationalHoursOutput,
  OperationalHoursOutputSchema,
  StaffingRequirementsOutput,
  StaffingRequirementsOutputSchema,
} from '@fuku/api/schemas'
import { DayOfWeekKey } from '@fuku/domain/schemas'
import {
  Button,
  Checkbox,
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
  FieldSet,
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
import z from 'zod/v4'

import { NumberStepperInput } from '~/components/ui/number-stepper-input'
import { TIME_OPTIONS, WEEKDAY_MAP } from '~/lib/date'
import { useTRPC } from '~/trpc/client'

const NON_NEGATIVE_MIN = 1

const DailyRequirementsFormSchema = z.object({
  operationalHours: OperationalHoursOutputSchema,
  staffingRequirements: StaffingRequirementsOutputSchema,
})

type DailyRequirementsFormType = z.infer<typeof DailyRequirementsFormSchema>

export function DailyRequirementsSection({ teamId }: { teamId: string }) {
  const trpc = useTRPC()

  const { data: operationalHours, isSuccess: hoursFetched } = useQuery({
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

  const { data: staffingRequirements } = useQuery({
    ...trpc.staffingRequirement.list.queryOptions({ teamId }),
    enabled: !!teamId,
  })

  const { mutateAsync: setStaffing } = useMutation({
    ...trpc.staffingRequirement.setStaffing.mutationOptions(),
    onSuccess: () => {
      form.reset(form.getValues())
      toast.success('Staffing Requirements', {
        description: 'Changes saved!',
      })
    },
    onError: error => {
      toast.error('Staffing Requirements', {
        description: error.message,
      })
    },
  })

  const createDefaultDay = () => ({
    teamId,
    startTime: '09:00' as string,
    endTime: '17:00' as string,
    deletedAt: new Date() as Date | null,
  })

  const createDefaultStaffing = () => ({
    teamId,
    minMembers: NON_NEGATIVE_MIN,
    maxMembers: NON_NEGATIVE_MIN,
  })

  const form = useForm<DailyRequirementsFormType>({
    defaultValues: {
      operationalHours: {
        1: createDefaultDay(),
        2: createDefaultDay(),
        3: createDefaultDay(),
        4: createDefaultDay(),
        5: createDefaultDay(),
        6: createDefaultDay(),
        7: createDefaultDay(),
        ...operationalHours,
      },
      staffingRequirements: {
        1: createDefaultStaffing(),
        2: createDefaultStaffing(),
        3: createDefaultStaffing(),
        4: createDefaultStaffing(),
        5: createDefaultStaffing(),
        6: createDefaultStaffing(),
        7: createDefaultStaffing(),
        ...staffingRequirements,
      },
    },
    resolver: zodResolver(DailyRequirementsFormSchema),
  })

  const resetForm = () => {
    if (operationalHours) {
      form.reset(values => ({ ...values, operationalHours }), {
        keepDirtyValues: false,
        keepDirty: false,
      })
    }

    if (staffingRequirements) {
      form.reset(values => ({ ...values, staffingRequirements }), {
        keepDirtyValues: false,
        keepDirty: false,
      })
    }
  }

  useEffect(() => {
    const updatedOpHours = {
      1: createDefaultDay(),
      2: createDefaultDay(),
      3: createDefaultDay(),
      4: createDefaultDay(),
      5: createDefaultDay(),
      6: createDefaultDay(),
      7: createDefaultDay(),
    }

    const updatedStaffingReqs = {
      1: createDefaultStaffing(),
      2: createDefaultStaffing(),
      3: createDefaultStaffing(),
      4: createDefaultStaffing(),
      5: createDefaultStaffing(),
      6: createDefaultStaffing(),
      7: createDefaultStaffing(),
    }

    if (operationalHours) {
      for (const day of Object.keys(operationalHours) as DayOfWeekKey[]) {
        updatedOpHours[day] = {
          ...createDefaultDay(),
          ...operationalHours[day],
        }
      }
    }

    if (staffingRequirements) {
      for (const day of Object.keys(staffingRequirements) as DayOfWeekKey[]) {
        updatedStaffingReqs[day] = {
          ...createDefaultStaffing(),
          ...staffingRequirements[day],
        }
      }
    }

    form.reset(values => ({
      ...values,
      operationalHours: updatedOpHours,
      staffingRequirements: updatedStaffingReqs,
    }))
  }, [operationalHours, staffingRequirements])

  const onSubmit: SubmitHandler<DailyRequirementsFormType> = async values => {
    // console.log('form values on submit:', values)

    try {
      const dirtyOperationalHours = form.formState.dirtyFields.operationalHours
      const dirtyStaffingRequirements =
        form.formState.dirtyFields.staffingRequirements

      let hoursUpdated = true
      let staffingUpdated = true

      // Extract days where ANY nested field changed
      if (!dirtyOperationalHours) {
        hoursUpdated = false
      } else {
        const dirtyDays = Object.keys(dirtyOperationalHours).filter(day => {
          const value =
            dirtyOperationalHours[day as keyof typeof dirtyOperationalHours]
          return value && Object.keys(value as object).length > 0
        })

        if (dirtyDays.length === 0) {
          hoursUpdated = false
        } else {
          const operationalHours = dirtyDays.reduce((acc, day) => {
            acc[day as DayOfWeekKey] =
              values.operationalHours[
                day as keyof typeof values.operationalHours
              ]
            return acc
          }, {} as OperationalHoursOutput)

          await setHours({ teamId, operationalHours })
        }
      }

      if (!dirtyStaffingRequirements) {
        staffingUpdated = false
      } else {
        const dirtyDays = Object.keys(dirtyStaffingRequirements).filter(day => {
          const value =
            dirtyStaffingRequirements[
              day as keyof typeof dirtyStaffingRequirements
            ]
          return value && Object.keys(value as object).length > 0
        })

        if (dirtyDays.length === 0) {
          staffingUpdated = false
        } else {
          const staffingRequirements = dirtyDays.reduce((acc, day) => {
            acc[day as DayOfWeekKey] =
              values.staffingRequirements[
                day as keyof typeof values.staffingRequirements
              ]
            return acc
          }, {} as StaffingRequirementsOutput)

          await setStaffing({ teamId, staffingRequirements })
        }
      }
    } catch {
      // handled in mutation onError
    }
  }

  const onError: SubmitErrorHandler<OperationalHoursOutput> = errors => {
    console.log('operational hour form errors:', errors)
    console.log('operational hour form values on error:', form.getValues())
  }

  return (
    <div className='flex flex-col gap-4 md:w-md'>
      <div className='container grid grid-cols-2 gap-3'>
        <h2>Daily Requirements</h2>
      </div>
      <form
        onSubmit={form.handleSubmit(onSubmit, onError)}
        className='flex flex-col gap-4'
      >
        <FieldSet className='flex flex-col gap-4 col-span-2 md:col-span-1'>
          {(Object.keys(WEEKDAY_MAP) as DayOfWeekKey[]).map(day => {
            const weekday = WEEKDAY_MAP[day]
            return (
              <Item size='xs' key={day} className='flex items-center gap-4'>
                <ItemContent className='gap-3'>
                  <ItemTitle>{weekday}</ItemTitle>
                  <ItemActions className='gap-3 grid grid-cols-4 *:items-center'>
                    {/* CLOSED CHECKBOX */}
                    <Controller
                      control={form.control}
                      name={`operationalHours.${day}.deletedAt`}
                      render={({ field }) => (
                        <Field
                          id={`closed-${day}`}
                          orientation='horizontal'
                          className='col-span-4'
                        >
                          <Checkbox
                            {...field}
                            value={field.value ? 'open' : 'closed'}
                            name={`closed-${day}`}
                            disabled={!hoursFetched}
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
                      name={`operationalHours.${day}.startTime`}
                      render={({ field }) => (
                        <Field id={`start-time-${day}`} className='col-span-2'>
                          <FieldLabel htmlFor={`start-time-${day}`}>
                            Start Time
                          </FieldLabel>
                          <Select
                            {...field}
                            value={field.value ?? ''}
                            onValueChange={field.onChange}
                            disabled={
                              !hoursFetched ||
                              form.watch(
                                `operationalHours.${day}.deletedAt`,
                              ) !== null
                            }
                          >
                            <SelectTrigger className='w-full grow'>
                              <SelectValue placeholder='-' />
                            </SelectTrigger>
                            <SelectContent className='w-full grow'>
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
                      name={`operationalHours.${day}.endTime`}
                      render={({ field }) => (
                        <Field id={`end-time-${day}`} className='col-span-2'>
                          <FieldLabel htmlFor={`end-time-${day}`}>
                            End Time
                          </FieldLabel>
                          <Select
                            {...field}
                            value={field.value ?? ''}
                            onValueChange={field.onChange}
                            disabled={
                              !hoursFetched ||
                              form.watch(
                                `operationalHours.${day}.deletedAt`,
                              ) !== null
                            }
                          >
                            <SelectTrigger className='w-full grow'>
                              <SelectValue placeholder='-' />
                            </SelectTrigger>
                            <SelectContent className='w-full grow'>
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

                    {/* MIN MEMBERS */}
                    <Controller
                      control={form.control}
                      name={`staffingRequirements.${day}.minMembers`}
                      render={({ field }) => (
                        <Field className='col-span-2'>
                          <FieldLabel>Minimum Members</FieldLabel>
                          <NumberStepperInput
                            value={field.value ?? NON_NEGATIVE_MIN}
                            onValueChange={minValue => {
                              const maxValue = form.watch(
                                `staffingRequirements.${day}.maxMembers`,
                              )
                              if (
                                maxValue !== undefined &&
                                minValue > maxValue
                              ) {
                                form.setValue(
                                  `staffingRequirements.${day}.maxMembers`,
                                  minValue,
                                  { shouldDirty: true },
                                )
                              }
                              return field.onChange(minValue)
                            }}
                            disabled={
                              !staffingRequirements ||
                              form.watch(
                                `operationalHours.${day}.deletedAt`,
                              ) !== null
                            }
                            min={NON_NEGATIVE_MIN}
                          />
                        </Field>
                      )}
                    />

                    {/* MAX MEMBERS */}
                    <Controller
                      control={form.control}
                      name={`staffingRequirements.${day}.maxMembers`}
                      render={({ field }) => (
                        <Field className='col-span-2'>
                          <FieldLabel>Maximum Members</FieldLabel>
                          <NumberStepperInput
                            value={
                              field.value ??
                              form.watch(
                                `staffingRequirements.${day}.maxMembers`,
                              ) ??
                              NON_NEGATIVE_MIN
                            }
                            onValueChange={maxValue => {
                              const minValue = form.watch(
                                `staffingRequirements.${day}.minMembers`,
                              )

                              if (
                                minValue !== undefined &&
                                maxValue < minValue
                              ) {
                                form.setValue(
                                  `staffingRequirements.${day}.minMembers`,
                                  maxValue,
                                  { shouldDirty: true },
                                )
                              }
                              return field.onChange(maxValue)
                            }}
                            disabled={
                              !staffingRequirements ||
                              form.watch(
                                `operationalHours.${day}.deletedAt`,
                              ) !== null
                            }
                            min={NON_NEGATIVE_MIN}
                          />
                        </Field>
                      )}
                    />
                  </ItemActions>
                </ItemContent>
              </Item>
            )
          })}
        </FieldSet>

        {/* Save/Cancel buttons  */}
        <Field orientation='horizontal' className='gap-4 last:mt-2 col-span-2'>
          <Button type='submit' disabled={!hoursFetched}>
            Save Changes
          </Button>

          <Button
            type='button'
            disabled={!hoursFetched}
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
