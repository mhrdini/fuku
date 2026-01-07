import { useEffect } from 'react'
import { PayGradeInputSchema } from '@fuku/db/schemas'
import {
  Button,
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
  Input,
  SheetClose,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Spinner,
} from '@fuku/ui/components'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import z from 'zod/v4'

import { useDashboardStore } from '~/store/dashboard'
import { useSheetStore } from '~/store/sheet'
import { useTRPC } from '~/trpc/client'

const PayGradeCreateFormSchema = PayGradeInputSchema.extend({
  name: z.string().min(1, { error: 'invalid_pay_grade_name' }),
  description: z.string().optional(),
  baseRate: z
    .number({ error: 'invalid_base_rate' })
    .min(0, { error: 'invalid_base_rate_negative' }),
}).omit({
  team: true,
  teamMembers: true,
})

type PayGradeCreateFormGrade = z.infer<typeof PayGradeCreateFormSchema>

export const CreatePayGradeFormSheet = () => {
  const title = 'Create New Pay Grade'
  const { closeSheet } = useSheetStore()

  const { currentTeamId } = useDashboardStore()
  const form = useForm<PayGradeCreateFormGrade>({
    defaultValues: {
      teamId: currentTeamId || '',
      name: '',
      baseRate: 0,
    },
    resolver: zodResolver(PayGradeCreateFormSchema),
  })

  useEffect(() => {
    if (currentTeamId) {
      form.resetField('teamId', { defaultValue: currentTeamId })
    }
  }, [currentTeamId])

  const queryClient = useQueryClient()
  const trpc = useTRPC()
  const { mutateAsync: createPayGrade, isPending } = useMutation({
    ...trpc.payGrade.create.mutationOptions(),
    onError: error => {
      toast.error(
        `ERROR${error.data?.httpStatus && ` (${error.data.httpStatus})`}: ${error.message}`,
      )
    },
    onSuccess: data => {
      closeSheet()
      queryClient.invalidateQueries({
        ...trpc.payGrade.list.queryOptions({}),
      })
      toast.success(`${data.name} has been created.`)
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
                    placeholder='e.g. Morning Pay'
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
          </FieldGroup>
        </FieldSet>
        <SheetFooter>
          <Button disabled={isPending}>
            {isPending ? <Spinner /> : 'Create pay grade'}
          </Button>
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
