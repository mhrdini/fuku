'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import { ColorHex } from '@fuku/db/schemas'
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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import z from 'zod/v4'

import { useSheetStore } from '~/store/sheet'
import { useTRPC } from '~/trpc/client'

const LocationCreateFormSchema = z.object({
  teamId: z.string(),
  name: z.string().min(1, { error: 'invalid_location_name' }),
  address: z.string().optional(),
  color: ColorHex.optional(),
})

type LocationCreateFormType = z.infer<typeof LocationCreateFormSchema>

export const CreateLocationFormSheet = () => {
  const title = 'Create New Location'
  const { closeSheet } = useSheetStore()

  const params = useParams()
  const slug = params?.slug as string

  const queryClient = useQueryClient()
  const trpc = useTRPC()
  const { data: team } = useQuery({
    ...trpc.team.bySlug.queryOptions({
      slug,
    }),
    enabled: !!slug,
  })

  const form = useForm<LocationCreateFormType>({
    defaultValues: {
      teamId: team?.id || '',
      name: '',
      address: '',
    },
    resolver: zodResolver(LocationCreateFormSchema),
  })

  useEffect(() => {
    if (team) {
      form.resetField('teamId', { defaultValue: team.id })
    }
  }, [team])

  const { mutateAsync: createLocation, isPending } = useMutation({
    ...trpc.location.create.mutationOptions(),
    onError: error => {
      toast.error(
        `ERROR${error.data?.httpStatus && ` (${error.data.httpStatus})`}: ${error.message}`,
      )
    },
    onSuccess: data => {
      closeSheet()
      queryClient.invalidateQueries(
        trpc.location.listDetailed.queryOptions({
          teamId: team!.id,
        }),
      )
      toast.success(`${data.name} has been created.`)
    },
  })

  const onSubmit = async (data: LocationCreateFormType) => {
    try {
      await createLocation(data)
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
        id='form-create-location'
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
                  <FieldLabel htmlFor='form-create-location-name'>
                    Name
                  </FieldLabel>
                  <Input
                    {...field}
                    id='form-create-location-name'
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
                  <FieldLabel htmlFor='form-create-location-address'>
                    Address
                  </FieldLabel>
                  <Input
                    {...field}
                    id='form-create-location-address'
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
            {isPending ? <Spinner /> : 'Create location'}
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
