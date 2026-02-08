'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import {
  LocationCreateInput,
  LocationCreateInputSchema,
} from '@fuku/api/schemas'
import {
  Button,
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
} from '@fuku/ui/components'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Controller,
  SubmitErrorHandler,
  SubmitHandler,
  useForm,
} from 'react-hook-form'
import { toast } from 'sonner'

import { SheetId } from '~/lib/sheet'
import { useSheetStore } from '~/store/sheet'
import { useTRPC } from '~/trpc/client'

const LocationCreateFormSchema = LocationCreateInputSchema

type LocationCreateFormType = LocationCreateInput

export const CreateLocationFormSheet = () => {
  const title = 'Create New Location'
  const { id, closeSheet } = useSheetStore()

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
      name: '',
      address: '',
    },
    resolver: zodResolver(LocationCreateFormSchema),
  })

  useEffect(() => {
    if (id === SheetId.CREATE_LOCATION && team?.id) {
      form.setValue('teamId', team.id, {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: false,
      })
    }
  }, [id, team?.id])

  const { mutateAsync: createLocation, isPending } = useMutation({
    ...trpc.location.create.mutationOptions(),
    onError: error => {
      toast.error(
        `ERROR${error.data?.httpStatus && ` (${error.data.httpStatus})`}: ${error.message}`,
      )
    },
    onSuccess: data => {
      closeSheet()
      queryClient.setQueryData(
        trpc.location.byId.queryKey({ id: data.id }),
        data,
      )
      queryClient.invalidateQueries(
        trpc.location.listIds.queryOptions({
          teamId: team!.id,
        }),
      )
      queryClient.invalidateQueries(
        trpc.location.listDetailed.queryOptions({
          teamId: team!.id,
        }),
      )
      toast.success(`${data.name} has been created.`)
    },
  })
  const onSubmit: SubmitHandler<LocationCreateFormType> = async data => {
    console.log('create location form values:', form.getValues())
    console.log('create location form errors:', form.formState.errors)
    try {
      await createLocation(data)
    } catch {
      // handled in onError
    }
  }

  const onError: SubmitErrorHandler<LocationCreateFormType> = errors => {
    console.log('create location form errors:', errors)
    console.log('create location form values:', form.getValues())
  }

  return (
    <>
      <SheetHeader>
        <SheetTitle>{title}</SheetTitle>
      </SheetHeader>
      <form
        id='form-create-location'
        className='flex flex-col gap-4 h-full'
        onSubmit={form.handleSubmit(onSubmit, onError)}
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
          <LoadingButton form='form-create-location' loading={isPending}>
            Create location
          </LoadingButton>
          <SheetClose asChild>
            <Button type='button' variant='outline' disabled={isPending}>
              Close
            </Button>
          </SheetClose>
        </SheetFooter>
      </form>
    </>
  )
}
