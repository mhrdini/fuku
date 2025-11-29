'use client'

import { useCallback, useMemo } from 'react'
import { useParams } from 'next/navigation'
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
import { Column, ColumnDef } from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ArrowUpDown, Ellipsis } from 'lucide-react'

import { TeamMemberUI, toTeamMemberUI } from '~/lib/member'
import { getHiddenColumns } from '~/lib/table'
import { useTeamMemberStore } from '~/store/member'
import { useTRPC } from '~/trpc/client'
import { ContentSkeleton } from '../../content-skeleton'
import { EditMemberFormDialog } from './edit-member-form-dialog'
import { MembersDataTableSection } from './members-data-table-section'
import { RemoveMemberAlertDialog } from './remove-member-alert-dialog'

const defaultVisibleColumns = ['fullName', 'payGradeName']

const getMultiSortIcon = (column: Column<any, any>) => {
  return column.getIsSorted() === 'asc' ? (
    <ArrowUp />
  ) : column.getIsSorted() === 'desc' ? (
    <ArrowDown />
  ) : (
    <ArrowUpDown />
  )
}

export default function TeamMembersContent() {
  const trpc = useTRPC()
  const params = useParams()
  const currentTeamSlug = params.slug as string
  const {
    editDialogOpen,
    setEditDialogOpen,
    removeDialogOpen,
    setRemoveDialogOpen,
    setCurrentTeamMemberId,
  } = useTeamMemberStore()

  const { data: members, isPending } = useQuery({
    ...trpc.teamMember.getAllByTeam.queryOptions({
      teamSlug: currentTeamSlug!,
    }),
    enabled: !!currentTeamSlug,
  })

  const onEditMemberClick = useCallback((id: string) => {
    setEditDialogOpen(true)
    setCurrentTeamMemberId(id)
  }, [])

  const onRemoveMemberClick = useCallback((id: string) => {
    setRemoveDialogOpen(true)
    setCurrentTeamMemberId(id)
  }, [])

  const columns = useMemo<ColumnDef<TeamMemberUI, any>[]>(
    () => [
      {
        accessorKey: 'fullName',
        enableHiding: false,
        meta: {
          label: 'Name',
        },
        header: ({ column }) => {
          return (
            <Button
              variant='ghost'
              className='-ml-3'
              onClick={() => column.toggleSorting()}
            >
              Name
              {getMultiSortIcon(column)}
            </Button>
          )
        },
      },
      {
        accessorKey: 'payGradeName',
        filterFn: 'arrIncludesSome',
        meta: {
          label: 'Pay Grade',
        },
        header: ({ column }) => {
          return (
            <Button
              variant='ghost'
              className='-ml-3'
              onClick={() => column.toggleSorting()}
            >
              Pay Grade
              {getMultiSortIcon(column)}
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
        header: ({ column }) => column.columnDef.meta?.label,
      },
      {
        accessorKey: 'rateMultiplier',
        meta: { label: 'Rate Multiplier' },
        header: ({ column }) => column.columnDef.meta?.label,
        cell: info => info.getValue<number>().toFixed(2),
      },
      {
        accessorKey: 'effectiveRate',
        meta: { label: 'Effective Rate' },
        header: ({ column }) => column.columnDef.meta?.label,
        cell: info =>
          info.getValue<number>() != null
            ? `${info.getValue<number>()}`
            : 'N/A',
      },
      {
        id: 'actions',
        enableHiding: false,
        header: () => (
          <div className='w-[32px]'>
            <span className='sr-only'>Actions</span>
          </div>
        ),
        cell: ({ row }) => {
          const teamMember = row.original
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='ghost'
                  className='size-8 p-0 absolute top-1/2 right-2 -translate-y-1/2'
                >
                  <span className='sr-only'>Open menu</span>
                  <Ellipsis />
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
                  Remove
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
      <EditMemberFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />
      <RemoveMemberAlertDialog
        open={removeDialogOpen}
        onOpenChange={setRemoveDialogOpen}
      />
    </>
  )

  return isPending ? <ContentSkeleton /> : <>{teamMembersTableSection}</>
}
