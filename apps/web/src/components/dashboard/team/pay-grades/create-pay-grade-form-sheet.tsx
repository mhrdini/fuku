'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import {
  PayGradeCreateInput,
  PayGradeCreateInputSchema,
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

import { SheetId } from '~/lib/sheet'
import { useSheetStore } from '~/store/sheet.store'
import { useTRPC } from '~/trpc/client'

const PayGradeCreateFormSchema = PayGradeCreateInputSchema
type PayGradeCreateFormGrade = PayGradeCreateInput

export const CreatePayGradeFormSheet = () => {
  const title = 'Create New Pay Grade'
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

  const { data: shiftTypes } = useQuery({
    ...trpc.shiftType.listDetailed.queryOptions({ teamId: team!.id }),
    enabled: !!team,
  })

  const form = useForm<PayGradeCreateFormGrade>({
    defaultValues: {
      name: '',
      baseRate: 0,
      connectShiftTypes: [],
    },
    resolver: zodResolver(PayGradeCreateFormSchema),
  })

  useEffect(() => {
    if (id === SheetId.CREATE_PAY_GRADE && team?.id) {
      form.setValue('teamId', team.id, {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: false,
      })
    }
  }, [id, team?.id])

  const { mutateAsync: createPayGrade, isPending } = useMutation({
    ...trpc.payGrade.create.mutationOptions(),
    onError: error => {
      toast.error('Error', {
        description: `${error.data?.httpStatus && ` (${error.data.httpStatus})`}: ${error.message}`,
      })
    },
    onSuccess: data => {
      closeSheet()
      queryClient.setQueryData(
        trpc.payGrade.byId.queryKey({ id: data.id }),
        data,
      )
      queryClient.invalidateQueries(
        trpc.payGrade.listIds.queryOptions({ teamId: team!.id }),
      )
      queryClient.invalidateQueries(
        trpc.payGrade.listDetailed.queryOptions({ teamId: team!.id }),
      )
      toast.success('Pay Grade', {
        description: `${data.name} has been created.`,
      })
    },
  })

  const onSubmit = async (data: PayGradeCreateFormGrade) => {
    try {
      await createPayGrade(data)
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
        id='form-create-pay-grade'
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
                  <FieldLabel htmlFor='form-create-pay-grade-name'>
                    Name
                  </FieldLabel>
                  <Input
                    {...field}
                    id='form-create-pay-grade-name'
                    aria-invalid={fieldState.invalid}
                    placeholder='e.g. Full-time'
                    autoComplete='off'
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name='baseRate'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='form-create-pay-grade-base-rate'>
                    Base Rate
                  </FieldLabel>
                  <Input
                    {...field}
                    id='form-create-pay-grade-base-rate'
                    type='number'
                    step='0.01'
                    min='0'
                    aria-invalid={fieldState.invalid}
                    placeholder='Base Rate'
                    autoComplete='off'
                    onChange={e =>
                      field.onChange(
                        e.target.value === '' ? 0 : Number(e.target.value),
                      )
                    }
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name='connectShiftTypes'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='form-create-pay-grade-connect-shift-types'>
                    Eligible Shift Types
                  </FieldLabel>
                  <Combobox
                    id='form-create-pay-grade-connect-shift-types'
                    {...field}
                    multiple
                    items={shiftTypes ?? []}
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <ComboboxChips ref={anchor}>
                      <ComboboxValue>
                        {(ids: string[]) => (
                          <>
                            {ids.map(id => {
                              const st = shiftTypes?.find(st => st.id === id)
                              if (!st) return null

                              return (
                                <ComboboxChip key={id}>{st.name}</ComboboxChip>
                              )
                            })}
                            <ComboboxChipsInput />
                          </>
                        )}
                      </ComboboxValue>
                    </ComboboxChips>
                    <ComboboxContent anchor={anchor}>
                      <ComboboxEmpty>No shift types found.</ComboboxEmpty>
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
                              'connectShiftTypes',
                              shiftTypes?.map(st => st.id),
                            )
                          }
                        >
                          Select all
                        </Button>
                        <Button
                          variant='link'
                          className='text-center px-3 text-muted-foreground hover:text-foreground hover:no-underline'
                          type='button'
                          onClick={() => form.setValue('connectShiftTypes', [])}
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
          <LoadingButton form='form-create-pay-grade' loading={isPending}>
            Create
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
