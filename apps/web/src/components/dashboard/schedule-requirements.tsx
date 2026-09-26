import { useCallback, useEffect, useRef } from 'react'

import {
  OperationalHoursOutputSchema,
  StaffingRequirementsOutputSchema,
} from '@fuku/api/schemas'
import { useTranslation } from '@fuku/i18n/react'
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
import { cn } from '@fuku/ui/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Controller,
  useForm,
  useFormState,
} from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod/v4'

import type {
  OperationalHoursOutput,
  StaffingRequirementsOutput,
} from '@fuku/api/schemas'
import type { WeekdayKey } from '@fuku/domain/schemas'
import type {
  SubmitErrorHandler,
  SubmitHandler,
} from 'react-hook-form'

import { NumberStepperInput } from '~/components/ui/number-stepper-input'
import { getWeekdayMap, TIME_OPTIONS } from '~/lib/date'
import { useTRPC } from '~/trpc/client'

const NON_NEGATIVE_MIN = 1

const ScheduleRequirementsFormSchema = z.object({
  operationalHours: OperationalHoursOutputSchema,
  staffingRequirements: StaffingRequirementsOutputSchema,
})

type ScheduleRequirementsFormType = z.infer<typeof ScheduleRequirementsFormSchema>

function createDefaultDay(teamId: string) {
  return {
    teamId,
    startTime: '09:00' as string,
    endTime: '17:00' as string,
    deletedAt: new Date() as Date | null,
  }
}

function createDefaultStaffing(teamId: string) {
  return {
    teamId,
    minMembers: NON_NEGATIVE_MIN,
    maxMembers: NON_NEGATIVE_MIN,
  }
}

function getTimeAfter(time: string) {
  const index = TIME_OPTIONS.indexOf(time)
  return TIME_OPTIONS[index + 1] ?? time
}

function getTimeBefore(time: string) {
  const index = TIME_OPTIONS.indexOf(time)
  return TIME_OPTIONS[index - 1] ?? time
}

export function ScheduleRequirements({ teamId, autoUpdateOnChange = true }: { teamId: string, autoUpdateOnChange?: boolean }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const trpc = useTRPC()
  const initialisedTeamIdRef = useRef<string | null>(null)

  const { data: teamMemberCount } = useQuery({
    ...trpc.teamMember.countActive.queryOptions(),
  })

  const { data: operationalHours, isSuccess: hoursFetched } = useQuery({
    ...trpc.operationalHour.list.queryOptions({ teamId }),
  })

  const { data: staffingRequirements } = useQuery({
    ...trpc.staffingRequirement.list.queryOptions({ teamId }),
  })

  const form = useForm<ScheduleRequirementsFormType>({
    defaultValues: {
      operationalHours: {
        1: createDefaultDay(teamId),
        2: createDefaultDay(teamId),
        3: createDefaultDay(teamId),
        4: createDefaultDay(teamId),
        5: createDefaultDay(teamId),
        6: createDefaultDay(teamId),
        7: createDefaultDay(teamId),
        ...operationalHours,
      },
      staffingRequirements: {
        1: createDefaultStaffing(teamId),
        2: createDefaultStaffing(teamId),
        3: createDefaultStaffing(teamId),
        4: createDefaultStaffing(teamId),
        5: createDefaultStaffing(teamId),
        6: createDefaultStaffing(teamId),
        7: createDefaultStaffing(teamId),
        ...staffingRequirements,
      },
    },
    resolver: zodResolver(ScheduleRequirementsFormSchema),
  })

  const { mutateAsync: setHours } = useMutation({
    ...trpc.operationalHour.setHours.mutationOptions(),
    onSuccess: () => {
      form.reset(form.getValues())
      if (!autoUpdateOnChange) {
        toast.success(t('operationalHours'), {
          description: t('changesSaved', 'Changes saved!'),
        })
      }
      queryClient.invalidateQueries(trpc.operationalHour.list.queryOptions({ teamId }))
    },
    onError: (error) => {
      toast.error(t('operationalHours'), {
        description: error.message,
      })
    },
  })

  const { mutateAsync: setStaffing } = useMutation({
    ...trpc.staffingRequirement.setStaffing.mutationOptions(),
    onSuccess: () => {
      form.reset(form.getValues())
      if (!autoUpdateOnChange) {
        toast.success(t('staffingRequirements'), {
          description: t('changesSaved', 'Changes saved!'),
        })
      }
    },
    onError: (error) => {
      toast.error(t('staffingRequirements'), {
        description: error.message,
      })
    },
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
    if (
      initialisedTeamIdRef.current === teamId
      || !operationalHours
      || !staffingRequirements
    ) {
      return
    }

    const updatedOpHours = {
      1: createDefaultDay(teamId),
      2: createDefaultDay(teamId),
      3: createDefaultDay(teamId),
      4: createDefaultDay(teamId),
      5: createDefaultDay(teamId),
      6: createDefaultDay(teamId),
      7: createDefaultDay(teamId),
    }

    const updatedStaffingReqs = {
      1: createDefaultStaffing(teamId),
      2: createDefaultStaffing(teamId),
      3: createDefaultStaffing(teamId),
      4: createDefaultStaffing(teamId),
      5: createDefaultStaffing(teamId),
      6: createDefaultStaffing(teamId),
      7: createDefaultStaffing(teamId),
    }

    for (const day of Object.keys(operationalHours) as WeekdayKey[]) {
      updatedOpHours[day] = {
        ...createDefaultDay(teamId),
        ...operationalHours[day],
      }
    }

    for (const day of Object.keys(staffingRequirements) as WeekdayKey[]) {
      updatedStaffingReqs[day] = {
        ...createDefaultStaffing(teamId),
        ...staffingRequirements[day],
      }
    }

    form.reset({
      operationalHours: updatedOpHours,
      staffingRequirements: updatedStaffingReqs,
    })

    initialisedTeamIdRef.current = teamId
  }, [operationalHours, staffingRequirements, teamId, form])

  const onSubmit: SubmitHandler<ScheduleRequirementsFormType> = useCallback(async (values) => {
    try {
      const dirtyOperationalHours = form.formState.dirtyFields.operationalHours
      const dirtyStaffingRequirements
        = form.formState.dirtyFields.staffingRequirements

      // Extract days where ANY nested field changed
      if (dirtyOperationalHours) {
        const dirtyDays = Object.keys(dirtyOperationalHours).filter((day) => {
          const value
            = dirtyOperationalHours[day as keyof typeof dirtyOperationalHours]
          return value && Object.keys(value as object).length > 0
        })

        if (dirtyDays.length > 0) {
          const operationalHours = dirtyDays.reduce((acc, day) => {
            acc[day as WeekdayKey]
              = values.operationalHours[
                day as keyof typeof values.operationalHours
              ]
            return acc
          }, {} as OperationalHoursOutput)

          await setHours({ teamId, operationalHours })
        }
      }

      if (dirtyStaffingRequirements) {
        const dirtyDays = Object.keys(dirtyStaffingRequirements).filter((day) => {
          const value
            = dirtyStaffingRequirements[
              day as keyof typeof dirtyStaffingRequirements
            ]
          return value && Object.keys(value as object).length > 0
        })

        if (dirtyDays.length > 0) {
          const staffingRequirements = dirtyDays.reduce((acc, day) => {
            acc[day as WeekdayKey]
              = values.staffingRequirements[
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
  }, [form.formState.dirtyFields.operationalHours, form.formState.dirtyFields.staffingRequirements, setHours, setStaffing, teamId])

  const onError: SubmitErrorHandler<OperationalHoursOutput> = (errors) => {
    console.error('operational hour form errors:', errors)
    console.error('operational hour form values on error:', form.getValues())
  }

  const { dirtyFields } = useFormState({
    control: form.control,
  })

  useEffect(() => {
    if (!autoUpdateOnChange || !hoursFetched || !staffingRequirements)
      return

    const dirtyOperationalHours = dirtyFields.operationalHours
    const dirtyStaffingRequirements = dirtyFields.staffingRequirements

    if (!dirtyOperationalHours && !dirtyStaffingRequirements)
      return

    const timeout = setTimeout(() => {
      void onSubmit(form.getValues())
    }, 500)

    return () => clearTimeout(timeout)
  }, [autoUpdateOnChange, dirtyFields, form, hoursFetched, onSubmit, staffingRequirements])

  return (
    <div className='flex flex-col gap-2 @[50rem]:w-fit'>
      {/* <div className='container grid grid-cols-2 gap-3'>
        <h2>{t('scheduleRequirements', 'Schedule Requirements')}</h2>
      </div> */}
      <form
        onSubmit={form.handleSubmit(onSubmit, onError)}
        className='flex flex-col gap-2'
      >
        <FieldSet className='flex flex-col gap-2'>
          {Array.from(getWeekdayMap()).map(([dayNumber, dayLocale]) => {
            const day = dayNumber as WeekdayKey
            const weekday = t(dayLocale)
            return (
              <Item size='xs' key={day} className='flex p-0 [&:not(:first-child)_label:not(.closed-label)]:invisible'>
                <ItemContent className='flex gap-2 @[50rem]:grid @[50rem]:grid-cols-5 @[50rem]:grid-rows-2 @[50rem]:items-start'>
                  <ItemTitle className='@[50rem]:col-span-1'>
                    {weekday}
                  </ItemTitle>
                  <ItemActions className='grid grid-cols-4 items-start gap-2 @[50rem]:col-span-4 @[50rem]:contents'>
                    {/* CLOSED CHECKBOX */}
                    <Controller
                      control={form.control}
                      name={`operationalHours.${day}.deletedAt`}
                      render={({ field }) => (
                        <Field
                          id={`closed-${day}`}
                          orientation='horizontal'
                          className='col-span-4 @[50rem]:col-span-1 @[50rem]:col-start-1 @[50rem]:row-start-2'
                        >
                          <Checkbox
                            {...field}
                            value={field.value ? 'open' : 'closed'}
                            name={`closed-${day}`}
                            disabled={!hoursFetched}
                            checked={!!field.value}
                            onCheckedChange={checked =>
                              field.onChange(checked ? new Date() : null, {
                                shouldDirty: true,
                              })}
                          />
                          <FieldContent>
                            <FieldLabel className='closed-label' htmlFor={`closed-${day}`}>
                              {t('closed', 'Closed')}
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
                        <Field
                          id={`start-time-${day}`}
                          className='col-span-2 @[50rem]:col-span-1 @[50rem]:col-start-2 @[50rem]:row-span-2 @[50rem]:row-start-1 @[50rem]:grid-rows-subgrid *:@[50rem]:row-span-1'
                        >
                          <FieldLabel htmlFor={`start-time-${day}`}>
                            {t('startTime', 'Start Time')}
                          </FieldLabel>
                          <Select
                            {...field}
                            value={field.value ?? ''}
                            onValueChange={(startTime) => {
                              field.onChange(startTime)

                              const endTime = form.getValues(
                                `operationalHours.${day}.endTime`,
                              )

                              if (!endTime || startTime >= endTime) {
                                form.setValue(
                                  `operationalHours.${day}.endTime`,
                                  getTimeAfter(startTime),
                                  { shouldDirty: true },
                                )
                              }
                            }}
                            disabled={
                              !hoursFetched
                              // || form.watch(
                              //   `operationalHours.${day}.deletedAt`,
                              // ) !== null
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
                        <Field
                          id={`end-time-${day}`}
                          className='col-span-2 @[50rem]:col-span-1 @[50rem]:col-start-3 @[50rem]:row-span-2 @[50rem]:row-start-1 @[50rem]:grid-rows-subgrid *:@[50rem]:row-span-1'
                        >
                          <FieldLabel htmlFor={`end-time-${day}`}>
                            {t('endTime', 'End Time')}
                          </FieldLabel>
                          <Select
                            {...field}
                            value={field.value ?? ''}
                            onValueChange={(endTime) => {
                              field.onChange(endTime)

                              const startTime = form.getValues(
                                `operationalHours.${day}.startTime`,
                              )

                              if (!startTime || endTime <= startTime) {
                                form.setValue(
                                  `operationalHours.${day}.startTime`,
                                  getTimeBefore(endTime),
                                  { shouldDirty: true },
                                )
                              }
                            }}
                            disabled={
                              !hoursFetched
                              // || form.watch(
                              //   `operationalHours.${day}.deletedAt`,
                              // ) !== null
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

                    {/* MIN STAFF / MIN MEMBERS */}
                    <Controller
                      control={form.control}
                      name={`staffingRequirements.${day}.minMembers`}
                      render={({ field }) => (
                        <Field className='col-span-2 @[50rem]:col-span-1 @[50rem]:col-start-4 @[50rem]:row-span-2 @[50rem]:grid-rows-subgrid *:@[50rem]:row-span-1'>
                          <FieldLabel>{t('minStaff', 'Min Staff')}</FieldLabel>
                          <NumberStepperInput
                            value={field.value ?? NON_NEGATIVE_MIN}
                            onValueChange={(minValue) => {
                              const maxValue = form.watch(
                                `staffingRequirements.${day}.maxMembers`,
                              )
                              if (
                                maxValue !== undefined
                                && minValue > maxValue
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
                              !staffingRequirements
                              // || form.watch(
                              //   `operationalHours.${day}.deletedAt`,
                              // ) !== null
                            }
                            min={NON_NEGATIVE_MIN}
                            max={teamMemberCount}
                          />
                        </Field>
                      )}
                    />

                    {/* MAX STAFF / MAX MEMBERS */}
                    <Controller
                      control={form.control}
                      name={`staffingRequirements.${day}.maxMembers`}
                      render={({ field }) => (
                        <Field className='col-span-2 @[50rem]:col-span-1 @[50rem]:col-start-5 @[50rem]:row-span-2 @[50rem]:row-start-1 @[50rem]:grid-rows-subgrid *:@[50rem]:row-span-1'>
                          <FieldLabel>{t('maxStaff', 'Max Staff')}</FieldLabel>
                          <NumberStepperInput
                            value={
                              field.value
                              ?? form.watch(
                                `staffingRequirements.${day}.maxMembers`,
                              )
                              ?? NON_NEGATIVE_MIN
                            }
                            onValueChange={(maxValue) => {
                              const minValue = form.watch(
                                `staffingRequirements.${day}.minMembers`,
                              )

                              if (
                                minValue !== undefined
                                && maxValue < minValue
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
                              !staffingRequirements
                              // || form.watch(
                              //   `operationalHours.${day}.deletedAt`,
                              // ) !== null
                            }
                            min={NON_NEGATIVE_MIN}
                            max={teamMemberCount}
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
        <Field
          orientation='horizontal'
          className={cn(
            autoUpdateOnChange && 'hidden',
            'col-span-2 gap-2 last:mt-2',
          )}
        >
          <Button type='submit' disabled={!hoursFetched}>
            {t('saveChanges2', 'Save Changes')}
          </Button>

          <Button
            type='button'
            disabled={!hoursFetched}
            onClick={resetForm}
            variant='outline'
          >
            {t('reset', 'Reset')}
          </Button>

          <FieldError>{form.formState.errors.root?.message}</FieldError>
        </Field>
      </form>
    </div>
  )
}
