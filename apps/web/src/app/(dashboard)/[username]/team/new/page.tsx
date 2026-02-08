'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { TeamCreateInput, TeamCreateInputSchema } from '@fuku/api/schemas'
import {
  Badge,
  Button,
  Card,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
  Input,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@fuku/ui/components'
import { cn } from '@fuku/ui/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Check,
  ChevronDown,
  Ellipsis,
  Layers,
  Pencil,
  Plus,
  Shield,
  SlidersHorizontal,
  Trash2,
  UserRoundPlus,
} from 'lucide-react'
import {
  Controller,
  FormProvider,
  SubmitErrorHandler,
  SubmitHandler,
  useFieldArray,
  UseFieldArrayReturn,
  useForm,
  useFormContext,
} from 'react-hook-form'
import z from 'zod/v4'

import { useSession } from '~/components/providers/session-provider'
import { Step } from '~/components/ui/stepper'
import { useDebouncedCommit } from '~/hooks/useDebouncedCommit'
import { useStepper } from '~/hooks/useStepper'
import { useTRPC } from '~/trpc/client'

const TeamCreateFormSchema = TeamCreateInputSchema

type TeamCreateFormType = TeamCreateInput

const BasicInfoSectionSchema = TeamCreateFormSchema.pick({
  name: true,
  description: true,
})

type BasicInfoSectionType = z.infer<typeof BasicInfoSectionSchema>

const TeamMembersSectionSchema = TeamCreateFormSchema.pick({
  payGrades: true,
  teamMembers: true,
})

type TeamMembersSectionType = z.infer<typeof TeamMembersSectionSchema>

const TeamMemberFormSchema = TeamMembersSectionSchema.shape.teamMembers.element

type TeamMemberFormType = z.infer<typeof TeamMemberFormSchema>

const AdditionalDetailsSectionSchema = TeamCreateFormSchema.partial({
  locations: true,
  shiftTypes: true,
})

type AdditionalDetailsSectionType = z.infer<
  typeof AdditionalDetailsSectionSchema
>

const steps: Step[] = [
  { label: 'Basic Info', schema: BasicInfoSectionSchema },
  {
    label: 'Team Members',
    schema: TeamMembersSectionSchema,
  },
  {
    label: 'Additional Details',
    schema: AdditionalDetailsSectionSchema,
  },
]

export default function NewTeamPage() {
  const router = useRouter()
  const { stepper, index, prevStep, nextStep, currentStep } = useStepper(steps)

  const form = useForm<TeamCreateFormType>({
    mode: 'onTouched',
    shouldUnregister: false,
    resolver: zodResolver(TeamCreateFormSchema),
    defaultValues: {
      name: '',
      description: '',
      teamMembers: [],
      payGrades: [],
      locations: [],
      shiftTypes: [],
    },
  })

  const session = useSession()
  const queryClient = useQueryClient()
  const trpc = useTRPC()

  const { data: currentUser, isFetched } = useQuery(
    trpc.user.byUsername.queryOptions(
      {
        username: session?.user.username || '',
      },
      {
        enabled: !!session?.user.username,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
      },
    ),
  )

  // id values are only needed for client-side form state management
  // there will be server-generated ids upon creation that will actually be
  // stored in the db, so we can use random uuids here

  // for the case of pay grade ids, we use "payGradeClientId" to differentiate
  // between the server-generated ids "payGradeId" and the client-side ids
  // as we need to use the client ids to know which pay grade is assigned to
  // which team member. the create procedure will resolve the correct ids upon
  // pay grade and team member creation.

  useEffect(() => {
    if (isFetched && currentUser) {
      const exists = form
        .getValues('teamMembers')
        .some(m => m.userId === currentUser.id)

      if (!exists) {
        form.setValue('teamMembers', [
          {
            id: crypto.randomUUID(),
            userId: currentUser.id,
            givenNames: currentUser.name,
            familyName: '',
            teamMemberRole: 'ADMIN',
            rateMultiplier: 1,
            teamId: crypto.randomUUID(),
          },
        ])
      }
    }
  }, [isFetched, currentUser, form])

  const onNext = async () => {
    const fieldNames = Object.keys(currentStep.schema.shape) as Array<
      keyof TeamCreateFormType
    >

    const valid = await form.trigger(fieldNames)

    if (!valid) return

    nextStep()
  }

  const { mutateAsync: createTeam } = useMutation({
    ...trpc.team.create.mutationOptions(),
    onSuccess: data => {
      queryClient.invalidateQueries(trpc.user.getSidebarState.queryOptions())
      router.push(`/${session?.user.username}/team/${data.slug}`)
    },
  })

  const onSubmit: SubmitHandler<TeamCreateFormType> = values => {
    console.log('new team submitting:', values)
    try {
      createTeam(values)
    } catch {}
  }

  const onError: SubmitErrorHandler<TeamCreateFormType> = errors => {
    console.log('new team submit errors:', errors)
    console.log('new team submit values:', form.getValues())
  }

  const sections = [
    <BasicInfoSection />,
    <TeamMembersSection />,
    <AdditionalDetailsSection />,
  ] as const

  return (
    <div className='flex flex-col gap-6 max-w-lg mx-auto'>
      <h2>Create a new team</h2>
      {stepper}
      <FormProvider {...form}>
        <form
          id='form-new-team'
          onSubmit={form.handleSubmit(onSubmit, onError)}
        >
          {sections[index]}
          <Field orientation='horizontal' className='mt-6'>
            <Button
              type='button'
              variant='outline'
              className={cn(index > 0 && 'hidden', 'ml-auto')}
            >
              Cancel
            </Button>
            <Button
              type='button'
              variant='outline'
              className={cn(index === 0 && 'hidden', 'ml-auto')}
              onClick={prevStep}
            >
              Back
            </Button>
            <Button
              type='button'
              className={cn(index === steps.length - 1 && 'hidden')}
              onClick={onNext}
            >
              Next
            </Button>

            <Button
              type='submit'
              className={cn(index !== steps.length - 1 && 'hidden')}
            >
              Create
            </Button>
          </Field>
        </form>
      </FormProvider>
    </div>
  )
}

function BasicInfoSection() {
  const { control } = useFormContext<BasicInfoSectionType>()
  return (
    <FieldSet>
      <FieldGroup>
        <FieldDescription>
          Start with a name and description for your team.
        </FieldDescription>
        <Controller
          name='name'
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor='form-new-team-name'>Name</FieldLabel>
              <Input
                {...field}
                id='form-new-team-name'
                placeholder='My Team'
                aria-invalid={fieldState.invalid}
                autoComplete='off'
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name='description'
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor='form-new-team-description'>
                Description
              </FieldLabel>
              <Input
                {...field}
                value={field.value || ''}
                id='form-user-auth-description'
                aria-invalid={fieldState.invalid}
                placeholder='Description (optional)'
                autoComplete='off'
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>
    </FieldSet>
  )
}

function TeamMembersSection() {
  const [isPayGradeSheetOpen, setIsPayGradeSheetOpen] = useState(false)
  const [isTeamMemberSheetOpen, setIsTeamMemberSheetOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  const openAddMember = () => {
    setEditingIndex(null)
    setIsTeamMemberSheetOpen(true)
  }

  const openEditMember = (index: number) => {
    setEditingIndex(index)
    setIsTeamMemberSheetOpen(true)
  }

  const openPayGradeSheet = () => setIsPayGradeSheetOpen(true)

  const { control } = useFormContext<TeamCreateFormType>()

  const {
    fields: teamMemberFields,
    append: appendTeamMember,
    remove: removeTeamMember,
    update: updateTeamMember,
  } = useFieldArray({
    control,
    name: 'teamMembers',
    keyName: 'rhfId',
  })

  const {
    fields: payGradeFields,
    append: appendPayGrade,
    remove: removePayGrade,
    update: updatePayGrade,
  } = useFieldArray({
    control,
    name: 'payGrades',
    keyName: 'rhfId',
  })

  return (
    <FieldSet>
      <TeamMemberSheet
        open={isTeamMemberSheetOpen}
        onOpenChange={setIsTeamMemberSheetOpen}
        editingIndex={editingIndex}
        teamMembers={{
          fields: teamMemberFields,
          append: appendTeamMember,
          update: updateTeamMember,
          remove: removeTeamMember,
        }}
        payGrades={payGradeFields}
      />

      <PayGradesSheet
        open={isPayGradeSheetOpen}
        onOpenChange={setIsPayGradeSheetOpen}
        payGrades={{
          fields: payGradeFields,
          append: appendPayGrade,
          remove: removePayGrade,
          update: updatePayGrade,
        }}
      />
      <FieldGroup>
        <FieldDescription>Add members to your team.</FieldDescription>
      </FieldGroup>
      <Field orientation='horizontal'>
        <Button type='button' variant='outline' onClick={openPayGradeSheet}>
          <Layers />
          Pay Grades
        </Button>
        <Button
          type='button'
          variant='outline'
          className='ml-auto'
          onClick={openAddMember}
        >
          <UserRoundPlus />
          Add member
        </Button>
      </Field>
      <FieldGroup>
        <Card className='p-0'>
          <ItemGroup className='flex py-4 gap-2'>
            {teamMemberFields.map((field, index) => (
              <Item key={field.id} className='py-0'>
                <ItemContent>
                  <ItemTitle>
                    {field.givenNames} {field.familyName}
                  </ItemTitle>
                  <ItemDescription>
                    {'Pay Grade: '}
                    {(() => {
                      const pg = payGradeFields.find(
                        pg => pg.id === field.payGradeClientId,
                      )
                      return pg ? `${pg.name} (${pg.baseRate})` : 'Unassigned'
                    })()}
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  {field.teamMemberRole === 'ADMIN' && (
                    <Badge variant='outline'>Admin</Badge>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button type='button' variant='ghost' size='icon'>
                        <Ellipsis />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                      <DropdownMenuGroup>
                        <DropdownMenuItem
                          onSelect={() =>
                            openEditMember(
                              teamMemberFields.findIndex(
                                tm => tm.id === field.id,
                              ),
                            )
                          }
                        >
                          <Pencil />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuCheckboxItem
                          disabled={index === 0}
                          checked={field.teamMemberRole === 'ADMIN'}
                          onCheckedChange={checked =>
                            updateTeamMember(
                              teamMemberFields.findIndex(
                                tm => tm.id === field.id,
                              ),
                              {
                                ...field,
                                teamMemberRole: checked ? 'ADMIN' : 'STAFF',
                              },
                            )
                          }
                        >
                          <Shield />
                          Make admin
                        </DropdownMenuCheckboxItem>
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuGroup>
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>
                            <Layers />
                            Assign pay grade
                          </DropdownMenuSubTrigger>
                          <DropdownMenuPortal>
                            <DropdownMenuSubContent>
                              <DropdownMenuGroup>
                                <DropdownMenuLabel>Pay Grade</DropdownMenuLabel>
                                <DropdownMenuRadioGroup
                                  value={field.payGradeClientId || undefined}
                                >
                                  {payGradeFields.length === 0 && (
                                    <DropdownMenuItem disabled>
                                      No pay grades available
                                    </DropdownMenuItem>
                                  )}
                                  {payGradeFields.map(pg => (
                                    <DropdownMenuRadioItem
                                      key={pg.id}
                                      value={pg.id}
                                      onSelect={() => {
                                        const index =
                                          teamMemberFields.findIndex(
                                            tm => tm.id === field.id,
                                          )
                                        if (field.payGradeClientId === pg.id) {
                                          updateTeamMember(index, {
                                            ...field,
                                            payGradeClientId: undefined,
                                          })
                                        } else {
                                          updateTeamMember(index, {
                                            ...field,
                                            payGradeClientId: pg.id,
                                          })
                                        }
                                      }}
                                    >
                                      {pg.name} ({pg.baseRate})
                                    </DropdownMenuRadioItem>
                                  ))}
                                </DropdownMenuRadioGroup>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onSelect={openPayGradeSheet}>
                                  <SlidersHorizontal />
                                  Manage
                                </DropdownMenuItem>
                              </DropdownMenuGroup>
                            </DropdownMenuSubContent>
                          </DropdownMenuPortal>
                        </DropdownMenuSub>
                      </DropdownMenuGroup>
                      {index > 0 && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuGroup>
                            <DropdownMenuItem
                              variant='destructive'
                              onSelect={() =>
                                removeTeamMember(
                                  teamMemberFields.findIndex(
                                    tm => tm.id === field.id,
                                  ),
                                )
                              }
                            >
                              <Trash2 />
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </ItemActions>
              </Item>
            ))}
          </ItemGroup>
        </Card>
      </FieldGroup>
    </FieldSet>
  )
}

function TeamMemberSheet({
  open,
  onOpenChange,
  teamMembers,
  payGrades,
  editingIndex,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  teamMembers: Pick<
    UseFieldArrayReturn<TeamCreateFormType, 'teamMembers'>,
    'fields' | 'append' | 'update' | 'remove'
  >
  payGrades: { id: string; name?: string; baseRate?: number }[]
  editingIndex: number | null
}) {
  const { fields, append, update, remove } = teamMembers

  const [payGradeOpen, setPayGradeOpen] = useState(false)

  const form = useForm<TeamMemberFormType>({
    defaultValues: {
      id: crypto.randomUUID(),
      familyName: '',
      givenNames: '',
      teamMemberRole: 'STAFF',
      rateMultiplier: 1,
      teamId: crypto.randomUUID(),
    },
    resolver: zodResolver(TeamMemberFormSchema),
  })

  useEffect(() => {
    if (editingIndex !== null) {
      form.reset(fields[editingIndex], {
        keepDefaultValues: true,
      })
    } else {
      form.reset()
    }
  }, [editingIndex, open])

  const submitTeamMember = async (values: TeamMemberFormType) => {
    if (editingIndex !== null) {
      update(editingIndex, { ...fields[editingIndex], ...values })
    } else {
      append(values)
    }
    onOpenChange(false)
  }

  const deleteMember = () => {
    if (editingIndex !== null) {
      onOpenChange(false)
      remove(editingIndex)
    }
  }

  const handleOpenChange = async () => {
    onOpenChange(!open)
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className='flex flex-col gap-6'>
        <SheetHeader>
          <SheetTitle>
            {editingIndex !== null ? 'Edit team member' : 'Add team member'}
          </SheetTitle>
        </SheetHeader>

        <FormProvider {...form}>
          <form className='flex flex-col gap-4 px-4'>
            <Controller
              name='givenNames'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='form-create-member-given-names'>
                    Given Name(s)
                  </FieldLabel>
                  <Input
                    {...field}
                    id='form-create-member-given-names'
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
                  <FieldLabel htmlFor='form-create-member-family-name'>
                    Last Name
                  </FieldLabel>
                  <Input
                    {...field}
                    id='form-create-member-family-name'
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
                name='payGradeClientId'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className='col-span-2 sm:col-span-2'
                  >
                    <FieldLabel htmlFor='form-create-member-pay-grade-id'>
                      Pay Grade
                    </FieldLabel>
                    <Popover open={payGradeOpen} onOpenChange={setPayGradeOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          type='button'
                          id='form-create-member-pay-grade-id'
                          variant='outline'
                          role='combobox'
                          className='justify-between'
                        >
                          {field.value && payGrades
                            ? payGrades.find(pg => pg.id === field.value)?.name
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
                                      'payGradeClientId',
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
                <FieldLabel htmlFor='form-create-member-base-rate'>
                  Base Rate
                </FieldLabel>
                <Button
                  type='button'
                  id='form-create-member-base-rate'
                  variant='outline'
                  disabled
                  className='text-justify items-start justify-start disabled:opacity-100'
                >
                  {payGrades && form.getValues('payGradeClientId') ? (
                    payGrades.find(
                      pg => pg.id === form.getValues('payGradeClientId'),
                    )?.baseRate
                  ) : (
                    <span className='text-muted-foreground'>N/A</span>
                  )}
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
                    <FieldLabel htmlFor='form-create-member-rate-multiplier'>
                      Multiplier
                    </FieldLabel>
                    <Input
                      {...field}
                      id='form-create-member-rate-multiplier'
                      type='number'
                      step='0.01'
                      min='0'
                      aria-invalid={fieldState.invalid}
                      placeholder='Rate Multiplier'
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
            </div>

            <div className='flex gap-2 pt-4'>
              {editingIndex !== null && editingIndex !== 0 && (
                <Button
                  type='button'
                  variant='destructive'
                  onClick={deleteMember}
                >
                  <Trash2 />
                  Remove
                </Button>
              )}
              <Button
                type='button'
                className='ml-auto'
                onClick={async () => {
                  form.trigger().then(isValid => {
                    if (isValid) {
                      form.handleSubmit(submitTeamMember)()
                    } else {
                      console.log('form invalid', form.formState.errors)
                    }
                  })
                }}
              >
                {editingIndex !== null ? 'Save' : 'Add'}
              </Button>
            </div>
          </form>
        </FormProvider>
      </SheetContent>
    </Sheet>
  )
}

function PayGradesSheet({
  open,
  onOpenChange,
  payGrades,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  payGrades: Pick<
    UseFieldArrayReturn<TeamCreateFormType, 'payGrades'>,
    'fields' | 'append' | 'remove' | 'update'
  >
}) {
  const { getValues, setValue, trigger, formState } =
    useFormContext<TeamCreateFormType>()
  const { fields, append, remove, update } = payGrades

  const handleAdd = () => {
    append({
      id: crypto.randomUUID(),
      name: '',
      baseRate: 0,
    })
  }

  const handleDelete = (index: number) => {
    const id = fields[index].id

    remove(index)

    setValue(
      'teamMembers',
      getValues('teamMembers').map(m =>
        m.payGradeClientId === id ? { ...m, payGradeClientId: undefined } : m,
      ),
    )
  }

  const handleOpenChange = async () => {
    if (open) {
      const isValid = await trigger('payGrades')
      if (!isValid) return
    }
    onOpenChange(!open)
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className='flex flex-col gap-6'>
        <SheetHeader>
          <SheetTitle>Pay Grades</SheetTitle>
          <SheetDescription>
            Pay grades are shared across your team members.
          </SheetDescription>
        </SheetHeader>

        <ItemGroup className='grid flex-1 auto-rows-min gap-6 px-4'>
          {fields.map((field, index) => (
            <PayGradeItem
              key={field.id}
              field={field}
              index={index}
              update={update}
              onDelete={() => handleDelete(index)}
              error={formState.errors.payGrades?.[index]}
            />
          ))}
          <Button type='button' variant='outline' onClick={handleAdd}>
            <Plus />
            Add pay grade
          </Button>
        </ItemGroup>
      </SheetContent>
    </Sheet>
  )
}

function PayGradeItem({
  field,
  index,
  update,
  onDelete,
  error,
}: {
  field: {
    id: string
    name?: string
    baseRate?: number
  }
  index: number
  update: (index: number, value: any) => void
  onDelete: () => void
  error?: { name?: { message?: string }; baseRate?: { message?: string } }
}) {
  const [name, setName] = useState(field.name ?? '')
  const [baseRate, setBaseRate] = useState(field.baseRate ?? 0)

  const latestRef = useRef({
    name: field.name ?? '',
    baseRate: field.baseRate ?? 0,
  })

  useEffect(() => {
    setName(field.name ?? '')
    latestRef.current.name = field.name ?? ''
  }, [field.name])

  useEffect(() => {
    setBaseRate(field.baseRate ?? 0)
    latestRef.current.baseRate = field.baseRate ?? 0
  }, [field.baseRate])

  const commit = () => {
    update(index, {
      ...field,
      ...latestRef.current,
    })
  }

  const { schedule, flush } = useDebouncedCommit(commit)

  return (
    <Item className='p-0'>
      <ItemContent className='grid grid-cols-6 gap-4'>
        <Input
          value={name}
          placeholder='Pay grade name'
          className='col-span-4'
          aria-invalid={!!error?.name}
          onChange={e => {
            const value = e.target.value
            setName(value)
            latestRef.current.name = value
            schedule()
          }}
          onBlur={flush}
        />

        <Input
          type='number'
          value={baseRate}
          placeholder='Base rate'
          className='col-span-2'
          aria-invalid={!!error?.baseRate}
          onChange={e => {
            const value = Number(e.target.value)
            setBaseRate(value)
            latestRef.current.baseRate = value
            schedule()
          }}
          onBlur={flush}
        />
      </ItemContent>

      <ItemActions>
        <Button type='button' variant='ghost' size='icon' onClick={onDelete}>
          <Trash2 />
        </Button>
      </ItemActions>
    </Item>
  )
}

function AdditionalDetailsSection() {
  const [locationsOpen, setLocationsOpen] = useState(false)
  const [shiftTypesOpen, setShiftTypesOpen] = useState(false)

  const { control } = useFormContext<TeamCreateFormType>()

  const {
    fields: locationFields,
    append: appendLocation,
    remove: removeLocation,
    update: updateLocation,
  } = useFieldArray({
    control,
    name: 'locations',
    keyName: 'rhfId',
  })

  const {
    fields: shiftTypeFields,
    append: appendShiftType,
    remove: removeShiftType,
    update: updateShiftType,
  } = useFieldArray({
    control,
    name: 'shiftTypes',
    keyName: 'rhfId',
  })

  return (
    <FieldSet>
      <LocationsSheet
        open={locationsOpen}
        onOpenChange={setLocationsOpen}
        locations={{
          fields: locationFields,
          append: appendLocation,
          remove: removeLocation,
          update: updateLocation,
        }}
      />

      <ShiftTypesSheet
        open={shiftTypesOpen}
        onOpenChange={setShiftTypesOpen}
        shiftTypes={{
          fields: shiftTypeFields,
          append: appendShiftType,
          remove: removeShiftType,
          update: updateShiftType,
        }}
      />

      <FieldGroup>
        <FieldDescription>
          Optional details to better organise your team.
        </FieldDescription>
      </FieldGroup>

      <FieldGroup>
        <Card className='py-0'>
          <ItemGroup>
            <Item>
              <ItemContent>
                <ItemTitle>Locations</ItemTitle>
                <ItemDescription>
                  {locationFields.length
                    ? locationFields.map(l => l.name).join(', ')
                    : 'None added'}
                </ItemDescription>
              </ItemContent>
              <ItemActions>
                <Button
                  type='button'
                  variant='secondary'
                  onClick={() => setLocationsOpen(true)}
                >
                  Manage
                </Button>
              </ItemActions>
            </Item>

            <Item>
              <ItemContent>
                <ItemTitle>Shift types</ItemTitle>
                <ItemDescription>
                  {shiftTypeFields.length
                    ? shiftTypeFields
                        .map(s => `${s.name} (${s.startTime}-${s.endTime})`)
                        .join(', ')
                    : 'None added'}
                </ItemDescription>
              </ItemContent>
              <ItemActions>
                <Button
                  type='button'
                  variant='secondary'
                  onClick={() => setShiftTypesOpen(true)}
                >
                  Manage
                </Button>
              </ItemActions>
            </Item>
          </ItemGroup>
        </Card>
      </FieldGroup>
    </FieldSet>
  )
}

function LocationsSheet({
  open,
  onOpenChange,
  locations,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  locations: Pick<
    UseFieldArrayReturn<TeamCreateFormType, 'locations'>,
    'fields' | 'append' | 'remove' | 'update'
  >
}) {
  const { trigger, formState } = useFormContext<TeamCreateFormType>()
  const { fields, append, remove, update } = locations

  const handleOpenChange = async () => {
    if (open) {
      const isValid = await trigger('locations')
      if (!isValid) return
    }
    onOpenChange(!open)
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className='flex flex-col gap-6'>
        <SheetHeader>
          <SheetTitle>Locations</SheetTitle>
          <SheetDescription>
            Locations where your team operates.
          </SheetDescription>
        </SheetHeader>

        <ItemGroup className='grid gap-4 px-4'>
          {fields.map((field, index) => (
            <LocationItem
              key={field.id}
              field={field}
              index={index}
              update={update}
              onDelete={() => remove(index)}
              error={formState.errors.locations?.[index]}
            />
          ))}

          <Button
            type='button'
            variant='outline'
            onClick={() => append({ id: crypto.randomUUID(), name: '' })}
          >
            <Plus />
            Add location
          </Button>
        </ItemGroup>
      </SheetContent>
    </Sheet>
  )
}

function LocationItem({
  field,
  index,
  update,
  onDelete,
  error,
}: {
  field: { id: string; name?: string }
  index: number
  update: (index: number, value: any) => void
  onDelete: () => void
  error?: { name?: { message?: string } }
}) {
  const [name, setName] = useState(field.name ?? '')

  const latestRef = useRef({
    name: field.name ?? '',
  })

  useEffect(() => {
    setName(field.name ?? '')
    latestRef.current.name = field.name ?? ''
  }, [field.name])

  const commit = () => {
    update(index, {
      ...field,
      ...latestRef.current,
    })
  }

  const { schedule, flush } = useDebouncedCommit(commit)

  return (
    <Item className='p-0'>
      <ItemContent>
        <Input
          value={name}
          placeholder='Location name'
          onChange={e => {
            setName(e.target.value)
            latestRef.current.name = e.target.value
            schedule()
          }}
          onBlur={flush}
          aria-invalid={!!error?.name}
        />
      </ItemContent>
      <ItemActions>
        <Button type='button' variant='ghost' size='icon' onClick={onDelete}>
          <Trash2 />
        </Button>
      </ItemActions>
    </Item>
  )
}

function ShiftTypesSheet({
  open,
  onOpenChange,
  shiftTypes,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  shiftTypes: Pick<
    UseFieldArrayReturn<TeamCreateFormType, 'shiftTypes'>,
    'fields' | 'append' | 'remove' | 'update'
  >
}) {
  const { trigger, formState } = useFormContext<TeamCreateFormType>()
  const { fields, append, remove, update } = shiftTypes

  const handleOpenChange = async () => {
    if (open) {
      const isValid = await trigger('shiftTypes')
      if (!isValid) return
    }
    onOpenChange(!open)
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className='flex flex-col gap-6'>
        <SheetHeader>
          <SheetTitle>Shift Types</SheetTitle>
          <SheetDescription>
            Different types of shifts your team members can have.
          </SheetDescription>
        </SheetHeader>

        <ItemGroup className='grid gap-4 px-4'>
          {fields.map((field, index) => (
            <ShiftTypeItem
              key={field.id}
              field={field}
              index={index}
              update={update}
              onDelete={() => remove(index)}
              error={formState.errors.shiftTypes?.[index]}
            />
          ))}

          <Button
            type='button'
            variant='outline'
            onClick={() => {
              append({
                id: crypto.randomUUID(),
                name: '',
                startTime: '09:00',
                endTime: '17:00',
              })
            }}
          >
            <Plus />
            Add shift type
          </Button>
        </ItemGroup>
      </SheetContent>
    </Sheet>
  )
}

function ShiftTypeItem({
  field,
  index,
  update,
  onDelete,
  error,
}: {
  field: { id: string; name?: string; startTime?: string; endTime?: string }
  index: number
  update: (index: number, value: any) => void
  onDelete: () => void
  error?: {
    name?: { message?: string }
    startTime?: { message?: string }
    endTime?: { message?: string }
  }
}) {
  const [name, setName] = useState(field.name ?? '')
  const [startTime, setStartTime] = useState(field.startTime)
  const [endTime, setEndTime] = useState(field.endTime)

  const latestRef = useRef({
    name: field.name ?? '',
    startTime: field.startTime,
    endTime: field.endTime,
  })

  useEffect(() => {
    setName(field.name ?? '')
    latestRef.current.name = field.name ?? ''
  }, [field.name])

  useEffect(() => {
    setStartTime(field.startTime)
    latestRef.current.startTime = field.startTime
  }, [field.startTime])

  useEffect(() => {
    setEndTime(field.endTime)
    latestRef.current.endTime = field.endTime
  }, [field.endTime])

  const commit = () => {
    update(index, {
      ...field,
      ...latestRef.current,
    })
  }

  const { schedule, flush } = useDebouncedCommit(commit)

  return (
    <Item className='p-0'>
      <ItemContent className='grid grid-cols-6 gap-2'>
        <Input
          value={name}
          placeholder='Name'
          className='col-span-2'
          onChange={e => {
            setName(e.target.value)
            latestRef.current.name = e.target.value
            schedule()
          }}
          onBlur={flush}
          aria-invalid={!!error?.name}
        />
        <Input
          value={startTime}
          type='time'
          placeholder='09:00'
          autoComplete='off'
          className='col-span-2 appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none'
          onChange={e => {
            setStartTime(e.target.value)
            latestRef.current.startTime = e.target.value
            schedule()
          }}
          onBlur={flush}
          aria-invalid={!!error?.startTime}
        />
        <Input
          value={endTime}
          type='time'
          placeholder='17:00'
          autoComplete='off'
          className='col-span-2 appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none'
          onChange={e => {
            setEndTime(e.target.value)
            latestRef.current.endTime = e.target.value
            schedule()
          }}
          onBlur={flush}
          aria-invalid={!!error?.endTime}
        />
      </ItemContent>
      <ItemActions>
        <Button type='button' variant='ghost' size='icon' onClick={onDelete}>
          <Trash2 />
        </Button>
      </ItemActions>
    </Item>
  )
}
