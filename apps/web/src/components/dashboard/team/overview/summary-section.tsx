'use client'

import { useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  OperationalHourOutput,
  OperationalHourOutputSchema,
} from '@fuku/api/schemas'
import { DayOfWeekKey } from '@fuku/db/schemas'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
  Separator,
} from '@fuku/ui/components'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueries, useQuery } from '@tanstack/react-query'
import { ArrowRight, Calendar } from 'lucide-react'
import {
  Controller,
  SubmitHandler,
  useForm,
} from 'react-hook-form'
import { toast } from 'sonner'

import { useSession } from '~/components/providers/session-provider'
import { TIME_OPTIONS, WEEKDAY_MAP } from '~/lib/date'
import { isEntity } from '~/lib/db'
import { useTRPC } from '~/trpc/client'

const MAX_VISIBLE = 3

interface SummaryCardProps<T> {
  title: string
  items: T[] | undefined
  renderItem: (item: T) => React.ReactNode
  description?: string
  manageButtonText: string
  onManage?: () => void
}

function SummaryCard<T>({
  title,
  items,
  renderItem,
  description,
  manageButtonText,
  onManage,
}: SummaryCardProps<T>) {
  return (
    <Card className='min-w-[200px] p-0 gap-4 *:first:mt-4'>
      <CardHeader className='px-4 gap-0'>
        <CardTitle className='text-sm'>{title}</CardTitle>
        <CardDescription className='text-xs'>
          {description ?? `${items?.length ?? 0} items`}
        </CardDescription>
      </CardHeader>
      <Separator />
      <CardContent className='flex flex-1 flex-col px-4 gap-2'>
        {items && items.length > 0 ? (
          items.slice(0, MAX_VISIBLE).map(renderItem)
        ) : (
          <div
            className='text-sm text-muted-foreground'
            aria-description='no items'
          >
            —
          </div>
        )}
      </CardContent>
      <div className='p-0 mt-auto border-t'>
        <Button
          className='w-full rounded-b-xl rounded-t-none'
          onClick={onManage}
          variant='ghost'
        >
          {manageButtonText}
          <ArrowRight />
        </Button>
      </div>
    </Card>
  )
}

export const SummarySection = () => {
  const session = useSession()
  const params = useParams()
  const slug = params.slug as string

  const router = useRouter()
  const trpc = useTRPC()

  const { data: team } = useQuery({
    ...trpc.team.bySlug.queryOptions({ slug: slug! }),
    enabled: !!slug,
  })

  const { mutateAsync: generateMonthly } = useMutation({
    ...trpc.schedule.generateMonthly.mutationOptions(),
    onSuccess: schedule => {
      console.log(schedule)
    },
  })

  const handleGenerateSchedule = async () => {
    if (!team) return

    try {
      await generateMonthly({
        teamId: team.id,
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
      })
    } catch (err) {
      // handle in onError
    }
  }

  const [
    { data: memberIds },
    { data: locationIds },
    { data: payGradeIds },
    { data: shiftTypeIds },
  ] = useQueries({
    queries: [
      {
        ...trpc.teamMember.listIds.queryOptions({ teamId: team!.id }),
        enabled: !!team,
      },
      {
        ...trpc.location.listIds.queryOptions({ teamId: team!.id }),
        enabled: !!team,
      },
      {
        ...trpc.payGrade.listIds.queryOptions({ teamId: team!.id }),
        enabled: !!team,
      },
      {
        ...trpc.shiftType.listIds.queryOptions({ teamId: team!.id }),
        enabled: !!team,
      },
    ],
  })

  const memberQueries = useQueries({
    queries: (memberIds ?? []).map(({ id }) => ({
      ...trpc.teamMember.byId.queryOptions({ id }),
      enabled: !!memberIds,
    })),
  })

  const members = useMemo(() => {
    return memberQueries.map(q => q.data).filter(isEntity)
  }, [memberQueries])

  const locationQueries = useQueries({
    queries: (locationIds ?? []).map(({ id }) => ({
      ...trpc.location.byId.queryOptions({ id }),
      enabled: !!locationIds,
    })),
  })

  const locations = useMemo(() => {
    return locationQueries.map(q => q.data).filter(isEntity)
  }, [locationQueries])

  const payGradeQueries = useQueries({
    queries: (payGradeIds ?? []).map(({ id }) => ({
      ...trpc.payGrade.byId.queryOptions({ id }),
      enabled: !!payGradeIds,
    })),
  })

  const payGrades = useMemo(() => {
    return payGradeQueries.map(q => q.data).filter(isEntity)
  }, [payGradeQueries])

  const shiftTypeQueries = useQueries({
    queries: (shiftTypeIds ?? []).map(({ id }) => ({
      ...trpc.shiftType.byId.queryOptions({ id }),
      enabled: !!shiftTypeIds,
    })),
  })

  const shiftTypes = useMemo(() => {
    return shiftTypeQueries.map(q => q.data).filter(isEntity)
  }, [shiftTypeQueries])

  const onManageMembers = () => {
    router.push(`/${session?.user.username}/team/${slug}/members`)
  }

  const onManageLocations = () => {
    router.push(`/${session?.user.username}/team/${slug}/locations`)
  }

  const onManageShiftTypes = () => {
    router.push(`/${session?.user.username}/team/${slug}/shift-types`)
  }

  const onManagePayGrades = () => {
    router.push(`/${session?.user.username}/team/${slug}/pay-grades`)
  }

  const teamMembersSummary = (
    <SummaryCard
      title='Team Members'
      items={members}
      renderItem={member => (
        <div key={member.id} className='flex items-center justify-between'>
          <div className='text-sm flex gap-1 items-center'>
            {member.givenNames} {member.familyName}
            {/* {member.teamMemberRole === 'ADMIN' && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Crown className='size-3 text-muted-foreground fill-current' />
                </TooltipTrigger>
                <TooltipContent side='top'>
                  <span>Admin</span>
                </TooltipContent>
              </Tooltip>
            )} */}
          </div>
          {member.payGrade && (
            <Badge variant='outline'>{member.payGrade.name}</Badge>
          )}
        </div>
      )}
      manageButtonText='Manage'
      onManage={onManageMembers}
    />
  )

  const locationSummary = (
    <SummaryCard
      title='Active Locations'
      items={locations}
      renderItem={location => (
        <div key={location.id} className='flex items-center justify-between'>
          <Badge variant='outline'>
            <span
              style={{ ['--bg-color' as any]: location.color }}
              className='bg-[var(--bg-color)] rounded-full size-2'
            />
            <span>{location.name}</span>
          </Badge>
        </div>
      )}
      manageButtonText='Manage'
      onManage={onManageLocations}
    />
  )

  const shiftTypesSummary = (
    <SummaryCard
      title='Shift Types'
      items={shiftTypes}
      renderItem={st => (
        <div className='flex items-center justify-between' key={st.id}>
          <Badge variant='outline'>
            <span
              style={{ ['--bg-color' as any]: st.color }}
              className='bg-[var(--bg-color)] rounded-full size-2'
            />
            <span>{st.name}</span>
          </Badge>
          <div className='text-sm text-muted-foreground'>
            {st.startTime} - {st.endTime}
          </div>
        </div>
      )}
      manageButtonText='Manage'
      onManage={onManageShiftTypes}
    />
  )

  const payGradeSummary = (
    <SummaryCard
      title='Pay Grades'
      items={payGrades}
      renderItem={pg => (
        <div key={pg.id} className='flex items-center justify-between'>
          <Badge variant='outline'>
            <span>{pg.name}</span>
          </Badge>
          <Badge variant='secondary'>{pg.baseRate.toFixed(2)}</Badge>
        </div>
      )}
      manageButtonText='Manage'
      onManage={onManagePayGrades}
    />
  )

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex flex-row'>
        <h2>Summary</h2>
        <Button size='sm' className='ml-auto' onClick={handleGenerateSchedule}>
          <Calendar />
          Generate Schedule
        </Button>
      </div>
      <div className='grid grid-cols-1 @[24rem]/main:grid-cols-2 @[760px]/main:grid-cols-3 gap-4'>
        {teamMembersSummary}
        {locationSummary}
        {shiftTypesSummary}
        {payGradeSummary}
      </div>
      <OperationalHoursSection teamId={team?.id ?? ''} />
    </div>
  )
}

function OperationalHoursSection({ teamId }: { teamId: string }) {
  const trpc = useTRPC()

  const { data: operationalHours, isSuccess } = useQuery({
    ...trpc.operationalHour.list.queryOptions({ teamId }),
    enabled: !!teamId,
  })

  const { mutateAsync: setHours } = useMutation({
    ...trpc.operationalHour.setHours.mutationOptions(),
    onSuccess: () => {
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

  const defaultDay = {
    teamId,
    startTime: '',
    endTime: '',
    deletedAt: null as Date | null,
  }

  const form = useForm<OperationalHourOutput>({
    resolver: zodResolver(OperationalHourOutputSchema),
    defaultValues: {
      1: defaultDay,
      2: defaultDay,
      3: defaultDay,
      4: defaultDay,
      5: defaultDay,
      6: defaultDay,
      7: defaultDay,
    },
  })

  const resetForm = () => {
    if (operationalHours) {
      form.reset(operationalHours, {
        keepDirtyValues: false,
        keepDirty: false,
      })
    }
  }

  const onSubmit: SubmitHandler<OperationalHourOutput> = async values => {
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

      await setHours({ teamId, hours })
    } catch {
      // handled in mutation onError
    }
  }

  useEffect(() => {
    if (isSuccess && operationalHours) {
      form.reset(operationalHours)
    }
  }, [isSuccess, operationalHours])

  return (
    <div className='flex flex-col gap-4'>
      <h2>Operational Hours</h2>

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className='flex flex-col gap-2'
      >
        {(Object.keys(WEEKDAY_MAP) as DayOfWeekKey[]).map(day => {
          const weekday = WEEKDAY_MAP[day]
          return (
            <Item size='xs' key={day} className='flex items-center gap-4'>
              <ItemContent>
                <ItemTitle>{weekday}</ItemTitle>

                <ItemActions>
                  {/* CLOSED CHECKBOX */}
                  <Controller
                    control={form.control}
                    name={`${day}.deletedAt`}
                    render={({ field }) => (
                      <Field orientation='horizontal'>
                        <Checkbox
                          id={`closed-${day}`}
                          name={`closed-${day}`}
                          disabled={!isSuccess}
                          checked={field.value !== null}
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
                          disabled={!isSuccess}
                          value={field.value}
                          onValueChange={field.onChange}
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
                          disabled={!isSuccess}
                          value={field.value}
                          onValueChange={field.onChange}
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
