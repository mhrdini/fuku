'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import {
  ShiftTypeCreateInput,
  ShiftTypeCreateInputSchema,
} from '@fuku/api/schemas'
import {
  Button,
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxSeparator,
  ComboboxValue,
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
  Input,
  LoadingButton,
  SheetClose,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  useComboboxAnchor,
} from '@fuku/ui/components'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { useSheetStore } from '~/store/sheet.store'
import { useTRPC } from '~/trpc/client'
import { SheetId } from '../../../../lib/sheet'

const ShiftTypeCreateFormSchema = ShiftTypeCreateInputSchema

type ShiftTypeCreateFormType = ShiftTypeCreateInput

export const CreateShiftTypeFormSheet = () => {
  const title = 'Create New Shift Type'
  const { id, closeSheet } = useSheetStore()
  const anchor = useComboboxAnchor()

  const queryClient = useQueryClient()
  const trpc = useTRPC()
  const params = useParams()
  const slug = params?.slug as string
  const { data: team } = useQuery({
    ...trpc.team.bySlug.queryOptions({ slug: slug! }),
    enabled: !!slug,
  })

  const { data: payGrades } = useQuery({
    ...trpc.payGrade.listDetailed.queryOptions({ teamId: team!.id }),
    enabled: !!team,
  })

  const form = useForm<ShiftTypeCreateFormType>({
    defaultValues: {
      name: '',
      startTime: '09:00',
      endTime: '17:00',
      connectPayGrades: [],
    },
    resolver: zodResolver(ShiftTypeCreateFormSchema),
  })

  useEffect(() => {
    if (id === SheetId.CREATE_SHIFT_TYPE && team?.id) {
      form.setValue('teamId', team.id, {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: false,
      })
    }
  }, [id, team?.id])

  const { mutateAsync: createShiftType, isPending } = useMutation({
    ...trpc.shiftType.create.mutationOptions(),
    onError: error => {
      toast.error('Error', {
        description: `${error.data?.httpStatus && ` (${error.data.httpStatus})`}: ${error.message}`,
      })
    },
    onSuccess: data => {
      closeSheet()
      queryClient.setQueryData(
        trpc.shiftType.byId.queryKey({ id: data.id }),
        data,
      )
      queryClient.invalidateQueries(
        trpc.shiftType.listIds.queryOptions({ teamId: team!.id }),
      )
      queryClient.invalidateQueries(
        trpc.shiftType.listDetailed.queryOptions({ teamId: team!.id }),
      )
      toast.success('Shift Type', {
        description: `${data.name} has been created.`,
      })
    },
  })

  const onSubmit = async (data: ShiftTypeCreateFormType) => {
    try {
      // console.log('create shift type submit values:', data)
      await createShiftType(data)
    } catch {
      // handled in onError
    }
  }
  return (
    <>
      <SheetHeader>
        <SheetTitle>{title}</SheetTitle>
      </SheetHeader>
      <form
        id='form-create-shift-type'
        className='flex flex-col gap-4 h-full'
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <FieldSet className='grid gap-4 flex-1 auto-rows-min px-4'>
          <FieldGroup>
            <Controller
              name='name'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='form-create-shift-type-name'>
                    Name
                  </FieldLabel>
                  <Input
                    {...field}
                    id='form-create-shift-type-name'
                    aria-invalid={fieldState.invalid}
                    placeholder='e.g. Morning Shift'
                    autoComplete='off'
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name='startTime'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='form-create-shift-type-start-time'>
                    Start Time
                  </FieldLabel>
                  <Input
                    {...field}
                    type='time'
                    id='form-create-shift-type-start-time'
                    aria-invalid={fieldState.invalid}
                    placeholder='09:00'
                    autoComplete='off'
                    className='appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none'
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name='endTime'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='form-create-shift-type-end-time'>
                    End Time
                  </FieldLabel>
                  <Input
                    {...field}
                    type='time'
                    id='form-create-shift-type-end-time'
                    aria-invalid={fieldState.invalid}
                    placeholder='17:00'
                    autoComplete='off'
                    className='appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none'
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name='connectPayGrades'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='form-create-shift-type-connect-pay-grades'>
                    Eligible Pay Grades
                  </FieldLabel>
                  <Combobox
                    id='form-create-shift-type-connect-pay-grades'
                    {...field}
                    multiple
                    items={payGrades ?? []}
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <ComboboxChips ref={anchor}>
                      <ComboboxValue>
                        {(ids: string[]) => (
                          <>
                            {ids.map(id => {
                              const pg = payGrades?.find(pg => pg.id === id)
                              if (!pg) return null

                              return (
                                <ComboboxChip key={id}>{pg.name}</ComboboxChip>
                              )
                            })}
                            <ComboboxChipsInput />
                          </>
                        )}
                      </ComboboxValue>
                    </ComboboxChips>
                    <ComboboxContent anchor={anchor}>
                      <ComboboxEmpty>No pay grades found.</ComboboxEmpty>
                      <ComboboxList>
                        {item => (
                          <ComboboxItem key={item.id} value={item.id}>
                            {item.name}
                          </ComboboxItem>
                        )}
                      </ComboboxList>
                      <ComboboxSeparator className='m-0' />
                      <div className='flex flex-row w-full justify-between'>
                        <Button
                          variant='link'
                          className='text-center px-3 text-muted-foreground hover:text-foreground hover:no-underline'
                          type='button'
                          onClick={() =>
                            form.setValue(
                              'connectPayGrades',
                              payGrades?.map(pg => pg.id),
                            )
                          }
                        >
                          Select all
                        </Button>
                        <Button
                          variant='link'
                          className='text-center px-3 text-muted-foreground hover:text-foreground hover:no-underline'
                          type='button'
                          onClick={() => form.setValue('connectPayGrades', [])}
                        >
                          Clear all
                        </Button>
                      </div>
                    </ComboboxContent>
                  </Combobox>
                </Field>
              )}
            />
          </FieldGroup>
        </FieldSet>
        <SheetFooter>
          <LoadingButton form='form-create-shift-type' loading={isPending}>
            Create shift type
          </LoadingButton>
          <SheetClose asChild>
            <Button variant='outline' disabled={isPending}>
              Close
            </Button>
          </SheetClose>
        </SheetFooter>
      </form>
    </>
  )
}
