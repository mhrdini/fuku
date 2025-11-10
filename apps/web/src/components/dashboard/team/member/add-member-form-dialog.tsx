'use client'

import { TeamMemberRole } from '@fuku/db'
import { TeamMemberInputSchema } from '@fuku/db/schemas'
import {
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@fuku/ui/components'
import { cn } from '@fuku/ui/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, ChevronDown } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import z from 'zod/v4'

import { useDashboardStore } from '~/store/dashboard'
import { useTeamMemberStore } from '~/store/member'
import { useTRPC } from '~/trpc/client'

const TeamMemberCreateFormSchema = TeamMemberInputSchema.extend({
  givenNames: z.string().min(1, { error: 'invalid_given_names' }),
  familyName: z.string().min(1, { error: 'invalid_family_name' }),
  payGradeId: z.string({ error: 'invalid_pay_grade_id' }),
  rateMultiplier: z
    .number({ error: 'invalid_rate_multiplier' })
    .min(0, { error: 'invalid_rate_multiplier_negative' }),
}).omit({
  unavailabilities: true,
  dayAssignments: true,
})

type TeamMemberCreateFormType = z.infer<typeof TeamMemberCreateFormSchema>

interface AddMemberFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const AddMemberFormDialog = ({
  open,
  onOpenChange,
}: AddMemberFormDialogProps) => {
  const queryClient = useQueryClient()

  const { currentTeamId, currentTeamSlug } = useDashboardStore()
  const { payGradeOpen, setPayGradeOpen } = useTeamMemberStore()

  const form = useForm<TeamMemberCreateFormType>({
    defaultValues: {
      givenNames: '',
      familyName: '',
      teamId: currentTeamId || '',
      rateMultiplier: 1,
      teamMemberRole: TeamMemberRole.STAFF,
    },
    resolver: zodResolver(TeamMemberCreateFormSchema),
  })

  const trpc = useTRPC()

  const { data: payGrades } = useQuery({
    ...trpc.payGrade.getAllByTeamSlug.queryOptions({
      teamSlug: currentTeamSlug!,
    }),
    enabled: !!currentTeamSlug,
  })

  const { mutateAsync: addMember } = useMutation({
    ...trpc.teamMember.create.mutationOptions(),
    onError: error => {
      toast.error(
        `Error creating ${form.getFieldState('givenNames')} ${form.getFieldState('familyName')}: ${error.data?.code || error.message}`,
      )
    },
    onSuccess: data => {
      onOpenChange(false)
      queryClient.invalidateQueries({
        queryKey: trpc.team.getTeamMembersBySlug.queryKey(),
      })
      toast(
        `${data.givenNames} ${data.familyName} has been created successfully.`,
      )
    },
  })

  const onSubmit = async (data: TeamMemberCreateFormType) => {
    await addMember(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>New Team Member</DialogTitle>
        <FieldDescription>Add a new member to your team.</FieldDescription>
        <form id='form-add-member' onSubmit={form.handleSubmit(onSubmit)}>
          <FieldSet>
            <FieldGroup>
              <Controller
                name='givenNames'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor='form-add-member-given-names'>
                      Given Name(s)
                    </FieldLabel>
                    <Input
                      {...field}
                      id='form-add-member-given-names'
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
                    <FieldLabel htmlFor='form-add-member-family-name'>
                      Last Name
                    </FieldLabel>
                    <Input
                      {...field}
                      id='form-add-member-family-name'
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
                      <FieldLabel htmlFor='form-add-member-pay-grade-id'>
                        Pay Grade
                      </FieldLabel>
                      <Popover
                        open={payGradeOpen}
                        onOpenChange={setPayGradeOpen}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            id='form-add-member-pay-grade-id'
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
                        <PopoverContent className='p-0' align='start'>
                          <Command>
                            <CommandList>
                              <CommandEmpty>No pay grade found.</CommandEmpty>
                              <CommandGroup>
                                {payGrades?.map(pg => (
                                  <CommandItem
                                    key={pg.id}
                                    value={pg.id}
                                    onSelect={currentValue => {
                                      form.setValue(
                                        'payGradeId',
                                        currentValue,
                                        {
                                          shouldValidate: true,
                                          shouldTouch: true,
                                          shouldDirty: true,
                                        },
                                      )
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
                  <FieldLabel htmlFor='form-add-member-base-rate'>
                    Base Rate
                  </FieldLabel>
                  <Button
                    id='form-add-member-base-rate'
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
                      <FieldLabel htmlFor='form-add-member-rate-multiplier'>
                        Multiplier
                      </FieldLabel>
                      <Input
                        {...field}
                        id='form-add-member-rate-multiplier'
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
                <Button type='submit' form='form-add-member'>
                  Create
                </Button>
              </Field>
            </FieldGroup>
          </FieldSet>
        </form>
      </DialogContent>
    </Dialog>
  )
}
