'use client'

import { useCallback, useMemo } from 'react'
import {
  PayGradeOutputSchema,
  TeamMemberOutputSchema,
  UserOutputSchema,
} from '@fuku/db/schemas'
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@fuku/ui/components'
import { useQuery } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, MoreHorizontal } from 'lucide-react'
import z from 'zod/v4'

import { getHiddenColumns } from '~/lib/table'
import { useDashboardStore } from '~/store/dashboard'
import { useTeamMemberStore } from '~/store/member'
import { useTRPC } from '~/trpc/client'
import { ContentSkeleton } from '../../content-skeleton'
import { MembersDataTableSection } from './members-data-table-section'
import { RemoveMemberAlertDialog } from './remove-member-alert-dialog'

// --- For data table rows ---
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

export type TeamMember = z.infer<typeof TeamMemberSchema>

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
  const {
    editDialogOpen,
    setEditDialogOpen,
    deleteDialogOpen,
    setDeleteDialogOpen,
    setCurrentTeamMemberId,
  } = useTeamMemberStore()

  const { data: members, isPending } = useQuery({
    ...trpc.team.getTeamMembersBySlug.queryOptions({
      slug: currentTeamSlug!,
    }),
    enabled: !!currentTeamSlug,
  })

  const onEditMemberClick = useCallback((id: string) => {
    setEditDialogOpen(true)
    setCurrentTeamMemberId(id)
  }, [])

  const onRemoveMemberClick = useCallback((id: string) => {
    setDeleteDialogOpen(true)
    setCurrentTeamMemberId(id)
  }, [])

  const columns = useMemo<ColumnDef<TeamMemberUI, any>[]>(
    () => [
      {
        accessorKey: 'fullName',
        enableHiding: false,
        // don't include meta label to use custom header
        header: ({ column }) => {
          return (
            <Button
              variant='ghost'
              className='-ml-3'
              onClick={() => column.toggleSorting()}
            >
              Name
              <ArrowUpDown />
            </Button>
          )
        },
      },
      {
        accessorKey: 'payGradeName',
        filterFn: 'arrIncludesSome',
        header: ({ column }) => {
          return (
            <Button
              variant='ghost'
              className='-ml-3'
              onClick={() => column.toggleSorting()}
            >
              Pay Grade
              <ArrowUpDown />
            </Button>
          )
        },
        cell: info => (
          <Badge variant='outline'>{info.getValue<string>()}</Badge>
        ),
      },
      {
        accessorKey: 'baseRate',
        meta: { label: 'Base Rate' },
      },
      {
        accessorKey: 'rateMultiplier',
        meta: { label: 'Rate Multiplier' },
        cell: info => info.getValue<number>().toFixed(2),
      },
      {
        accessorKey: 'effectiveRate',
        meta: { label: 'Effective Rate' },
        cell: info =>
          info.getValue<number>() != null
            ? `${info.getValue<number>()}`
            : 'N/A',
      },
      {
        id: 'actions',
        enableHiding: false,
        cell: ({ row }) => {
          const teamMember = row.original
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='ghost' className='h-8 w-8 p-0'>
                  <span className='sr-only'>Open menu</span>
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuItem
                  onClick={() => {
                    onEditMemberClick(teamMember.id)
                  }}
                >
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant='destructive'
                  onClick={() => {
                    onRemoveMemberClick(teamMember.id)
                  }}
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    [],
  )

  const defaultHiddenColumns = useMemo(() => {
    return getHiddenColumns(defaultVisibleColumns, columns)
  }, [columns])

  const teamMembersTableSection = (
    <>
      <MembersDataTableSection
        columns={columns}
        data={members ? members.map(toTeamMemberUI) : []}
        defaultHiddenColumns={defaultHiddenColumns}
      />
      {/* <EditMemberFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      /> */}
      <RemoveMemberAlertDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      />
    </>
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
