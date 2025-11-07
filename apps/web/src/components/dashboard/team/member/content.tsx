'use client'

import { useMemo } from 'react'
import {
  PayGradeOutputSchema,
  TeamMemberOutputSchema,
  UserOutputSchema,
} from '@fuku/db/schemas'
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
} from '@fuku/ui/components'
import { useQuery } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'
import z from 'zod/v4'

import { getHiddenColumns } from '~/lib/table'
import { useDashboardStore } from '~/store/dashboard'
import { useTRPC } from '~/trpc/client'
import { ContentSkeleton } from '../../content-skeleton'
import { MembersDataTableSection } from './members-data-table-section'

// Extend the output schema with included relations
// from the procedure and also with UI-specific fields
export const TeamMemberSchema = TeamMemberOutputSchema.omit({
  dayAssignments: true,
  unavailabilities: true,
  team: true,
}).extend({
  // Included relations
  user: UserOutputSchema.pick({
    id: true,
    email: true,
    username: true,
  }).nullable(),
  payGrade: PayGradeOutputSchema.pick({
    id: true,
    name: true,
    baseRate: true,
  }).nullable(),
})
export const TeamMemberUISchema = TeamMemberSchema.extend({
  // UI-specific fields
  fullName: z.string(),
  payGradeName: z.string(),
  baseRate: z.number().nullable(),
  effectiveRate: z.number().nullable(),
  username: z.string().nullable(),
})

export type TeamMemberUI = z.infer<typeof TeamMemberUISchema>

export const toTeamMemberUI = (
  m: z.infer<typeof TeamMemberSchema>,
): TeamMemberUI => ({
  ...m,
  fullName: `${m.givenNames} ${m.familyName}`,
  payGradeName: m.payGrade?.name ?? 'No Pay Grade',
  baseRate: m.payGrade?.baseRate ?? null,
  effectiveRate: m.payGrade ? m.payGrade.baseRate * m.rateMultiplier : null,
  username: m.user ? m.user.username : null,
})

const defaultVisibleColumns = ['fullName', 'payGradeName']

export default function TeamMembersContent() {
  const trpc = useTRPC()
  const { currentTeamSlug } = useDashboardStore()

  const { data: members, isPending } = useQuery({
    ...trpc.team.getTeamMembersBySlug.queryOptions({
      slug: currentTeamSlug!,
    }),
    enabled: !!currentTeamSlug,
  })

  const columns = useMemo<ColumnDef<TeamMemberUI, any>[]>(
    () => [
      {
        accessorKey: 'fullName',
        header: ({ column }) => {
          return (
            <Button
              variant='ghost'
              className='-ml-3'
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === 'asc')
              }
            >
              Email
              <ArrowUpDown />
            </Button>
          )
        },
      },
      {
        accessorKey: 'payGradeName',
        header: 'Pay Grade',
        cell: info => (
          <Badge variant='outline'>{info.getValue<string>()}</Badge>
        ),
        filterFn: 'arrIncludesSome',
      },
      {
        accessorKey: 'baseRate',
        header: 'Base Rate',
      },
      {
        accessorKey: 'rateMultiplier',
        header: 'Rate Multiplier',
        cell: info => info.getValue<number>().toFixed(2),
      },
      {
        accessorKey: 'effectiveRate',
        header: 'Effective Rate',
        cell: info =>
          info.getValue<number>() != null
            ? `${info.getValue<number>()}`
            : 'N/A',
      },
    ],
    [],
  )

  const teamMembersTableSection = (
    <Dialog>
      <MembersDataTableSection
        columns={columns}
        data={members ? members.map(toTeamMemberUI) : []}
        defaultHiddenColumns={getHiddenColumns(defaultVisibleColumns, columns)}
      />
      <DialogContent>
        <DialogTitle>Add Team Member</DialogTitle>
      </DialogContent>
    </Dialog>
  )

  return isPending ? (
    <ContentSkeleton />
  ) : (
    <>
      <h1 className='text-xl font-semibold'>Team Members</h1>
      {teamMembersTableSection}
    </>
  )
}
