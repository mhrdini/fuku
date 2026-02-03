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
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Ellipsis,
  Pencil,
  Trash,
} from 'lucide-react'

import { DialogId } from '~/lib/dialog'
import { TeamMemberUI, toTeamMemberUI } from '~/lib/member'
import { getHiddenColumns } from '~/lib/table'
import { useDialogStore } from '~/store/dialog'
import { useTRPC } from '~/trpc/client'
import { MembersDataTableSection } from './members-data-table-section'

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
  const slug = params?.slug as string
  const { data: team } = useQuery({
    ...trpc.team.bySlug.queryOptions({ slug: slug! }),
    enabled: !!slug,
  })

  const { openDialog, openAlertDialog } = useDialogStore()

  const { data: members } = useQuery({
    ...trpc.teamMember.list.queryOptions({ teamId: team!.id }),
    enabled: !!team,
  })

  const onUpdateMember = useCallback((id: string) => {
    openDialog({
      id: DialogId.UPDATE_TEAM_MEMBER,
      editingId: id,
    })
  }, [])

  const onRemoveMember = useCallback((id: string) => {
    openAlertDialog({
      id: DialogId.REMOVE_TEAM_MEMBER,
      editingId: id,
    })
  }, [])

  const columns = useMemo<ColumnDef<TeamMemberUI, any>[]>(
    () => [
      {
        id: 'actions',
        enableHiding: false,
        header: () => (
          <div>
            <span className='sr-only'>Actions</span>
          </div>
        ),
        cell: ({ row }) => {
          const teamMember = row.original
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='ghost' className='size-8 -mx-1 -my-1'>
                  <span className='sr-only'>Open menu</span>
                  <Ellipsis />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='start'>
                <DropdownMenuItem
                  onClick={() => {
                    onUpdateMember(teamMember.id)
                  }}
                >
                  <Pencil /> Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant='destructive'
                  onClick={() => {
                    onRemoveMember(teamMember.id)
                  }}
                >
                  <Trash /> Remove
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
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
    ],
    [],
  )

  const defaultHiddenColumns = useMemo(() => {
    return getHiddenColumns(defaultVisibleColumns, columns)
  }, [columns])

  return (
    <MembersDataTableSection
      columns={columns}
      data={members ? members.map(toTeamMemberUI) : []}
      defaultHiddenColumns={defaultHiddenColumns}
    />
  )
}
