'use client'

import { useEffect } from 'react'

import {
  LocationCreateInputSchema,
} from '@fuku/api/schemas'
import { useTranslation } from '@fuku/i18n/react'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
  Input,
  LoadingButton,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@fuku/ui/components'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Controller,
  useForm,
} from 'react-hook-form'
import { toast } from 'sonner'

import type {
  LocationCreateInput,
} from '@fuku/api/schemas'
import type {
  SubmitErrorHandler,
  SubmitHandler,
} from 'react-hook-form'

import { SheetId } from '~/lib/sheet'
import { useSheetStore } from '~/store/sheet.store'
import { useTRPC } from '~/trpc/client'

const LocationCreateFormSchema = LocationCreateInputSchema

type LocationCreateFormType = LocationCreateInput

export function CreateLocationFormSheet() {
  const { t } = useTranslation()
  const title = t('createNewLocation', 'Create New Location')
  const { id, closeSheet } = useSheetStore()

  const queryClient = useQueryClient()
  const trpc = useTRPC()
  const { data: team } = useQuery({
    ...trpc.team.getActiveTeam.queryOptions(),
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
  }, [form, id, team?.id])

  const { mutateAsync: createLocation, isPending } = useMutation({
    ...trpc.location.create.mutationOptions(),
    onError: (error) => {
      toast.error(t('error'), {
        description: t('valMessage', '{{val}}: {{message}}', {
          val: error.data?.httpStatus && ` (${error.data.httpStatus})`,
          message: error.message,
        }),
      })
    },
    onSuccess: (data) => {
      closeSheet()
      queryClient.setQueryData(
        trpc.location.byId.queryKey({ id: data.id }),
        data,
      )
      queryClient.invalidateQueries(
        trpc.location.listIds.queryOptions({
          teamId: team?.id ?? '',
        }),
      )
      queryClient.invalidateQueries(
        trpc.location.list.queryOptions({
          teamId: team?.id ?? '',
        }),
      )
      toast.success(t('location'), {
        description: t('nameHasBeenCreated', '{{name}} has been created.', {
          name: data.name,
        }),
      })
    },
  })
  const onSubmit: SubmitHandler<LocationCreateFormType> = async (data) => {
    try {
      await createLocation(data)
    } catch {
      // handled in onError
    }
  }

  const onError: SubmitErrorHandler<LocationCreateFormType> = (errors) => {
    console.error('create location form errors:', errors)
    console.error('create location form values:', form.getValues())
  }

  return (
    <>
      <SheetHeader>
        <SheetTitle>{title}</SheetTitle>
      </SheetHeader>
      <form
        id='form-create-location'
        className='flex h-full flex-col gap-4'
        onSubmit={form.handleSubmit(onSubmit, onError)}
      >
        <FieldSet className='grid flex-1 auto-rows-min gap-4 px-4'>
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
                    placeholder={t('egMainOffice', 'e.g. Main Office')}
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
                    {t('address', 'Address')}
                  </FieldLabel>
                  <Input
                    {...field}
                    id='form-create-location-address'
                    aria-invalid={fieldState.invalid}
                    placeholder={t(
                      'eg123MainStCityCountry',
                      'e.g. 123 Main St, City, Country',
                    )}
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
        <SheetFooter className='mt-auto'>
          <LoadingButton form='form-create-location' loading={isPending}>
            {t('createLocation', 'Create location')}
          </LoadingButton>
          {/* <SheetClose asChild>
            <Button type='button' variant='outline' disabled={isPending}>
              {t('close', 'Close')}
            </Button>
          </SheetClose> */}
        </SheetFooter>
      </form>
    </>
  )
}
