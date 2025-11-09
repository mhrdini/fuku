'use client'

import { TeamMemberSchema } from '@fuku/db/schemas'
import {
  Button,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Spinner,
} from '@fuku/ui/components'
import { cn } from '@fuku/ui/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { Check, ChevronDown, Command } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import z from 'zod/v4'

import { useDashboardStore } from '~/store/dashboard'
import { useTeamMemberStore } from '~/store/member'
import { useTRPC } from '~/trpc/client'

const TeamMemberEditFormSchema = TeamMemberSchema.extend({
  teamMemberRole: TeamMemberSchema.shape.teamMemberRole.unwrap(),
  rateMultiplier: TeamMemberSchema.shape.rateMultiplier.unwrap(),
})

type TeamMemberEditFormType = z.output<typeof TeamMemberEditFormSchema>

interface EditMemberFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const EditMemberFormDialog = ({
  open,
  onOpenChange,
}: EditMemberFormDialogProps) => {
  const { currentTeamSlug } = useDashboardStore()
  const { currentTeamMemberId, payGradeOpen, setPayGradeOpen } =
    useTeamMemberStore()

  const trpc = useTRPC()
  const { data: teamMember } = useSuspenseQuery(
    trpc.teamMember.getById.queryOptions({
      id: currentTeamMemberId!,
    }),
  )
  const { data: payGrades } = useSuspenseQuery(
    trpc.payGrade.getAllByTeamSlug.queryOptions({
      teamSlug: currentTeamSlug!,
    }),
  )

  // Show spinner while loading
  if (!teamMember || !payGrades) return <Spinner />

  const form = useForm<TeamMemberEditFormType>({
    defaultValues: TeamMemberEditFormSchema.parse(teamMember),
    resolver: zodResolver(TeamMemberEditFormSchema),
  })

  const { mutateAsync: editMember } = useMutation({
    ...trpc.teamMember.update.mutationOptions(),
    onError: error => {
      console.error('Error updating team member:', error)
    },
  })

  const onSubmit = async (data: TeamMemberEditFormType) => {
    await editMember(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Edit Team Member</DialogTitle>
        <form id='form-edit-member' onSubmit={form.handleSubmit(onSubmit)}>
          <FieldSet>
            <FieldGroup>
              <Controller
                name='givenNames'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor='form-edit-member-given-names'>
                      Given Name(s)
                    </FieldLabel>
                    <Input
                      {...field}
                      id='form-edit-member-given-names'
                      aria-invalid={fieldState.invalid}
                      placeholder='Given Name(s)'
                      autoComplete='off'
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name='familyName'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor='form-edit-member-family-name'>
                      Last Name
                    </FieldLabel>
                    <Input
                      {...field}
                      id='form-edit-member-family-name'
                      aria-invalid={fieldState.invalid}
                      placeholder='Last Name'
                      autoComplete='off'
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
                <Controller
                  name='payGradeId'
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field
                      data-invalid={fieldState.invalid}
                      className='col-span-2 sm:col-span-2'
                    >
                      <FieldLabel htmlFor='form-edit-member-pay-grade-id'>
                        Pay Grade
                      </FieldLabel>
                      <Popover
                        open={payGradeOpen}
                        onOpenChange={setPayGradeOpen}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            id='form-edit-member-pay-grade-id'
                            variant='outline'
                            role='combobox'
                            className='justify-between'
                          >
                            {field.value && payGrades
                              ? payGrades.find(pg => pg.id === field.value)
                                  ?.name
                              : 'Select pay grade...'}
                            <ChevronDown className='opacity-50' />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className='p-0'>
                          <Command>
                            <CommandList>
                              <CommandEmpty>No pay grade found.</CommandEmpty>
                              <CommandGroup>
                                {payGrades?.map(pg => (
                                  <CommandItem
                                    key={pg.id}
                                    value={pg.id}
                                    onSelect={currentValue => {
                                      form.setValue('payGradeId', currentValue)
                                      setPayGradeOpen(false)
                                    }}
                                  >
                                    {pg.name}
                                    <Check
                                      className={cn(
                                        'ml-auto',
                                        pg.id === field.value
                                          ? 'opacity-100'
                                          : 'opacity-0',
                                      )}
                                    />
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Field className='col-span-1'>
                  <FieldLabel htmlFor='form-edit-member-base-rate'>
                    Base Rate
                  </FieldLabel>
                  <Button
                    id='form-edit-member-base-rate'
                    variant='outline'
                    disabled
                    className='text-justify items-start justify-start disabled:opacity-100'
                  >
                    {payGrades && form.getValues('payGradeId')
                      ? payGrades.find(
                          pg => pg.id === form.getValues('payGradeId'),
                        )?.baseRate
                      : 'N/A'}
                  </Button>
                </Field>
                <Controller
                  name='rateMultiplier'
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field
                      data-invalid={fieldState.invalid}
                      className='col-span-1'
                    >
                      <FieldLabel htmlFor='form-edit-member-rate-multiplier'>
                        Multiplier
                      </FieldLabel>
                      <Input
                        {...field}
                        id='form-edit-member-rate-multiplier'
                        type='number'
                        step='0.01'
                        min='0'
                        aria-invalid={fieldState.invalid}
                        placeholder='Rate Multiplier'
                        autoComplete='off'
                        onChange={e =>
                          field.onChange(parseFloat(e.target.value))
                        }
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </div>
              <Field orientation='responsive'>
                <DialogClose asChild>
                  <Button variant='outline' className='ml-auto'>
                    Cancel
                  </Button>
                </DialogClose>
                <Button type='submit' form='form-edit-member'>
                  Confirm
                </Button>
              </Field>
            </FieldGroup>
          </FieldSet>
        </form>
      </DialogContent>
    </Dialog>
  )
}
