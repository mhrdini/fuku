'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import {
  RuleConditionOutput,
  RuleOutput,
  TeamMemberOutput,
} from '@fuku/api/schemas'
import {
  RuleConditionField,
  RuleConditionFieldValues,
  RuleConditionOperator,
  RuleConditionOperatorValues,
} from '@fuku/domain/schemas'
import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
  DateRangePicker,
  Field,
  Item,
  ItemActions,
  ItemContent,
  ItemFooter,
  ItemTitle,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ScrollArea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@fuku/ui/components'
import { cn } from '@fuku/ui/lib/utils'
import { useQuery } from '@tanstack/react-query'
import {
  Check,
  ChevronDown,
  Cog,
  Plus,
  RefreshCcw,
  SlidersHorizontal,
  X,
} from 'lucide-react'

import { MONTH_MAP, WEEKDAY_MAP } from '~/lib/date'
import { useTRPC } from '~/trpc/client'

const RULE_CONDITION_FIELD_LABELS: Record<RuleConditionField, string> = {
  [RuleConditionFieldValues.MONTH]: 'Month',
  [RuleConditionFieldValues.WEEKDAY]: 'Weekday',
}

const RULE_CONDITION_OPERATOR_LABELS: Record<RuleConditionOperator, string> = {
  [RuleConditionOperatorValues.EQ]: '=',
  [RuleConditionOperatorValues.NEQ]: '≠',
  [RuleConditionOperatorValues.IN]: '∈',
  [RuleConditionOperatorValues.NOT_IN]: '∉',
  [RuleConditionOperatorValues.GTE]: '≥',
  [RuleConditionOperatorValues.LTE]: '≤',
}

const RULE_CONDITION_FIELD_OPTIONS = {
  [RuleConditionFieldValues.MONTH]: MONTH_MAP,
  [RuleConditionFieldValues.WEEKDAY]: WEEKDAY_MAP,
}

export const TeamScheduleContent = () => {
  const trpc = useTRPC()
  const params = useParams()
  const slug = params?.slug as string

  const [start, setStart] = useState(new Date())
  const [end, setEnd] = useState(new Date())

  const { data: team } = useQuery({
    ...trpc.team.bySlug.queryOptions({ slug: slug! }),
    enabled: !!slug,
  })

  const { data: teamMembers } = useQuery({
    ...trpc.teamMember.list.queryOptions({ teamId: team?.id ?? '' }),
    enabled: !!team,
  })

  const { data: dbAssignments } = useQuery({
    ...trpc.assignment.list.queryOptions({
      teamId: team?.id ?? '',
      start,
      end,
    }),
    enabled: !!team,
  })

  const { data: rules } = useQuery({
    ...trpc.rule.list.queryOptions({ teamId: team?.id ?? '' }),
    enabled: !!team,
  })

  const { data: ruleConditions } = useQuery({
    ...trpc.ruleCondition.groupByRules.queryOptions({
      ruleIds: rules ? rules.map(r => r.id) : [],
    }),
    enabled: !!rules && rules.length > 0,
  })

  return (
    <div className='flex flex-col gap-4'>
      <h2>Schedule</h2>
      {/* header */}
      <div className='flex gap-2'>
        <DateRangePicker
          align='start'
          variant='secondary'
          showCompare={false}
          initialDateFrom={start}
          initialDateTo={end}
          onUpdate={({ range }) => {
            setStart(range.from)
            setEnd(range.to || range.from)
          }}
        />
        <Button className='ml-auto'>
          <RefreshCcw />
          <span className='hidden md:flex'>Auto-Schedule</span>
        </Button>
        <Button variant='secondary'>
          <Cog />
          <span className='hidden md:flex'>Customize</span>
        </Button>
      </div>
      {/* xs breakpoint */}
      <div className='flex sm:hidden'></div>
      {/* sm breakpoint */}
      <div className='hidden sm:flex md:hidden'></div>
      {/* md+ breakpoint */}
      <div className='h-[600px] hidden md:grid grid-flow-col grid-cols-[350px_auto] border rounded-md border-input'>
        {/* panel */}
        <Tabs
          defaultValue='members'
          className='flex flex-col min-h-0 rounded-l-md gap-0 border-r border-input'
        >
          {/* panel tabs */}
          <div className='w-full p-2'>
            <TabsList className='w-full'>
              <TabsTrigger value='members'>Members</TabsTrigger>
              <TabsTrigger value='rules'>Rules</TabsTrigger>
            </TabsList>
          </div>
          <Separator className='border-input' />
          {/* members panel content */}
          <TabsContent value='members' className='flex flex-col flex-1 min-h-0'>
            <Command className='bg-inherit border-none rounded-none p-0'>
              <div className='p-2 border-b border-input flex items-center gap-2'>
                <CommandInput placeholder='Search' className='flex-1' />
                <Button variant='secondary' size='icon'>
                  <SlidersHorizontal />
                </Button>
              </div>
              <CommandList className='flex-1 min-h-0 h-full'>
                <CommandEmpty className='p-4 text-sm text-muted-foreground'>
                  No team members found.
                </CommandEmpty>
                {teamMembers &&
                  teamMembers.map(tm => (
                    <TeamMemberPanelItem key={tm.id} teamMember={tm} />
                  ))}
              </CommandList>
            </Command>
            <div className='p-2 border-t border-input'>
              <Button className='w-full' variant='secondary'>
                <Plus /> Add Member
              </Button>
            </div>
          </TabsContent>
          {/* rules panel content */}
          <TabsContent value='rules' className='flex flex-col flex-1 min-h-0'>
            {rules && rules.length > 0 ? (
              <ScrollArea className='flex-1 min-h-0'>
                <div className='flex flex-col p-2 gap-2'>
                  {rules.map(rule => (
                    <RulePanelItem
                      key={rule.id}
                      rule={rule}
                      ruleConditions={
                        ruleConditions ? ruleConditions[rule.id] || [] : []
                      }
                    />
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className='p-4 text-sm text-muted-foreground'>
                No rules defined yet.
              </div>
            )}
          </TabsContent>
        </Tabs>
        {/* calendar */}
        <div>calendar</div>
      </div>
      <div className='flex gap-2 justify-end'>
        <Button disabled>
          Save
          <Check />
        </Button>
      </div>
    </div>
  )
}

const TeamMemberPanelItem = ({
  teamMember,
}: {
  teamMember: TeamMemberOutput
}) => {
  return (
    <CommandItem
      value={
        teamMember.givenNames +
        (teamMember.familyName ? ' ' + teamMember.familyName : '')
      }
      noDefaultStyles
      className='not-last:border-b border-input'
    >
      <Collapsible>
        <CollapsibleTrigger className='w-full flex items-center justify-start'>
          <Item className='w-full'>
            <ItemTitle>
              <span>{teamMember.givenNames}</span>
              <span
                className={cn(teamMember.familyName ? 'inline-flex' : 'hidden')}
              >
                {' '}
                {teamMember.familyName}
              </span>
            </ItemTitle>
          </Item>
        </CollapsibleTrigger>
        <CollapsibleContent>{teamMember.payGrade?.name}</CollapsibleContent>
      </Collapsible>
    </CommandItem>
  )
}

const RulePanelItem = ({
  rule,
  ruleConditions,
}: {
  rule: RuleOutput
  ruleConditions: RuleConditionOutput[]
}) => {
  return (
    <div className=''>
      <Collapsible className='group rounded-lg bg-input/30'>
        <Item className='w-full gap-2 p-2'>
          <ItemContent>
            {/* target type*/}
            <Field></Field>
            {/* target selection, dependent on target */}
            <Field></Field>
            {/* metric */}
            <Field></Field>
            {/* time window */}
            <Field></Field>
            {/* operator */}
            <Field></Field>
            {/* threshold */}
            <Field></Field>
            {/* hard constraint y/n */}
            <Field></Field>
          </ItemContent>
          <ItemActions>
            <Button
              variant='ghost'
              size='icon-xs'
              onClick={e => e.stopPropagation()}
            >
              <X />
            </Button>
          </ItemActions>
          <ItemFooter className='justify-end'>
            <CollapsibleTrigger asChild>
              <Button variant='link' size='badge'>
                {ruleConditions.length} conditions
                <ChevronDown className=' transition-transform duration-300 ease-in-out group-data-[state=open]:rotate-180' />
              </Button>
            </CollapsibleTrigger>
          </ItemFooter>
        </Item>
        <CollapsibleContent className='p-2 flex flex-col items-end w-full min-w-0 rounded-b-lg'>
          {ruleConditions.map(rc => (
            <RuleConditionPanelItem key={rc.id} ruleCondition={rc} />
          ))}
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

const RuleConditionPanelItem = ({
  ruleCondition,
}: {
  ruleCondition: RuleConditionOutput
}) => {
  return (
    <div className='*:w-fit w-fit min-w-0 flex items-center gap-2 rounded-lg bg-input/30 p-2'>
      {/* rule condition field */}
      <Field className=''>
        <Select defaultValue={ruleCondition.field}>
          <SelectTrigger size='sm'>
            <SelectValue placeholder='Field' />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(RuleConditionFieldValues).map(key => (
              <SelectItem key={key} value={key}>
                {RULE_CONDITION_FIELD_LABELS[key as RuleConditionField]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      {/* rule condition operator */}
      <Field className=''>
        <Select defaultValue={ruleCondition.operator}>
          <SelectTrigger size='sm'>
            <SelectValue placeholder='Operator' />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(RuleConditionOperatorValues).map(key => (
              <SelectItem key={key} value={key}>
                {RULE_CONDITION_OPERATOR_LABELS[key as RuleConditionOperator]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      {/* rule condition value: multi-select combobox dependent on field */}
      <Field className=''>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              size='sm'
              variant='outline'
              role='combobox'
              className='h-auto min-h-8 w-full justify-between hover:bg-transparent'
            >
              <div className='flex flex-wrap items-center gap-1 pr-2.5'>
                <span className='text-muted-foreground'>Select</span>
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align='start'
            className='min-w-(--radix-popper-anchor-width) max-w-28 truncate p-0'
          >
            <Command>
              <CommandList>
                {Object.entries(
                  RULE_CONDITION_FIELD_OPTIONS[ruleCondition.field] || {},
                ).map(([key, label]) => (
                  <CommandItem key={key} value={key}>
                    {label}
                  </CommandItem>
                ))}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </Field>
      <Button variant='ghost' size='icon-xs' className=''>
        <X />
      </Button>
    </div>
  )
}
