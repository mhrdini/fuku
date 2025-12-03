import { useEffect } from 'react'
import { LocationInputSchema } from '@fuku/db/schemas'
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

const LocationCreateFormSchema = LocationInputSchema.extend({
  teamId: z.string(),
  name: z.string().min(1, { error: 'invalid_location_name' }),
  address: z.string().optional(),
  color: z.string().optional().nullable(),
}).omit({
  shiftAssignments: true,
})

type LocationCreateFormType = z.infer<typeof LocationCreateFormSchema>

export const AddLocationFormSheet = () => {
  const title = 'Add New Location'
  const { closeSheet } = useSheetStore()

  const { currentTeamId } = useDashboardStore()
  const form = useForm<LocationCreateFormType>({
    defaultValues: {
      teamId: currentTeamId || '',
      name: '',
      address: '',
    },
    resolver: zodResolver(LocationCreateFormSchema),
  })

  useEffect(() => {
    if (currentTeamId) {
      form.resetField('teamId', { defaultValue: currentTeamId })
    }
  }, [currentTeamId])

  const queryClient = useQueryClient()
  const trpc = useTRPC()
  const { mutateAsync: addLocation, isPending } = useMutation({
    ...trpc.location.create.mutationOptions(),
    onError: error => {
      toast.error(
        `ERROR${error.data?.httpStatus && ` (${error.data.httpStatus})`}: ${error.message}`,
      )
    },
    onSuccess: data => {
      closeSheet()
      queryClient.invalidateQueries({
        queryKey: trpc.location.getAllByTeam.queryKey(),
      })
      toast.success(`${data.name} has been added.`)
    },
  })

  const onSubmit = async (data: LocationCreateFormType) => {
    try {
      await addLocation(data)
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
        id='form-add-location'
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
                  <FieldLabel htmlFor='form-add-location-name'>
                    Location Name
                  </FieldLabel>
                  <Input
                    {...field}
                    id='form-add-location-name'
                    aria-invalid={fieldState.invalid}
                    placeholder='e.g. Main Office'
                    autoComplete='off'
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name='address'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='form-add-location-address'>
                    Address
                  </FieldLabel>
                  <Input
                    {...field}
                    id='form-add-location-address'
                    aria-invalid={fieldState.invalid}
                    placeholder='e.g. 123 Main St, City, Country'
                    autoComplete='off'
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
            {isPending ? <Spinner /> : 'Add location'}
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
