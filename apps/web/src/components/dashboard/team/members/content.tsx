'use client'

import { useCallback, useMemo } from 'react'

import { useTranslation } from '@fuku/i18n/react'
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@fuku/ui/components'
import { useQueries, useQuery } from '@tanstack/react-query'
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  EllipsisIcon,
  PencilIcon,
  TrashIcon,
} from 'lucide-react'

import type { Column, ColumnDef } from '@tanstack/react-table'

import { isEntity } from '~/lib/db'
import { DialogId } from '~/lib/dialog'
import { getHiddenColumns } from '~/lib/table'
import type { TeamMemberUI } from '~/lib/team-member'
import { toTeamMemberUI } from '~/lib/team-member'
import { useDialogStore } from '~/store/dialog.store'
import { useTRPC } from '~/trpc/client'

import { MembersDataTableSection } from './members-data-table-section'

const defaultVisibleColumns = ['fullName', 'payGradeName']

function getMultiSortIcon(column: Column<any, any>) {
  return column.getIsSorted() === 'asc'
    ? (
        <ArrowUpIcon />
      )
    : column.getIsSorted() === 'desc'
      ? (
          <ArrowDownIcon />
        )
      : (
          <ArrowUpDownIcon />
        )
}

export default function TeamMembersContent() {
  const { t } = useTranslation()
  const trpc = useTRPC()
  const { data: team } = useQuery({
    ...trpc.team.getActiveTeam.queryOptions(),
  })

  const { openDialog, openAlertDialog } = useDialogStore()

  const { data: memberIds } = useQuery({
    ...trpc.teamMember.listIds.queryOptions({}),
    enabled: !!team,
  })

  const memberQueries = useQueries({
    queries: (memberIds ?? []).map(({ id }) => ({
      ...trpc.teamMember.byId.queryOptions({ id }),
      enabled: !!memberIds,
    })),
  })

  const members = useMemo(() => {
    return memberQueries.map(q => q.data).filter(isEntity)
  }, [memberQueries])

  const onUpdateMember = useCallback((id: string) => {
    openDialog({
      id: DialogId.UPDATE_TEAM_MEMBER,
      editingId: id,
    })
  }, [openDialog])

  const onRemoveMember = useCallback((id: string) => {
    openAlertDialog({
      id: DialogId.REMOVE_TEAM_MEMBER,
      editingId: id,
    })
  }, [openAlertDialog])

  const columns = useMemo<ColumnDef<TeamMemberUI, any>[]>(
    () => [
      {
        id: 'actions',
        enableHiding: false,
        header: () => (
          <div>
            <span className='sr-only'>{t('actions', 'Actions')}</span>
          </div>
        ),
        cell: ({ row }) => {
          const teamMember = row.original
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='ghost' className='-mx-1 -my-1 size-8'>
                  <span className='sr-only'>{t('openMenu', 'Open menu')}</span>
                  <EllipsisIcon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='start'>
                <DropdownMenuItem
                  onClick={() => {
                    onUpdateMember(teamMember.id)
                  }}
                >
                  <PencilIcon />
                  {' '}
                  {t('edit', 'Edit')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant='destructive'
                  onClick={() => {
                    onRemoveMember(teamMember.id)
                  }}
                >
                  <TrashIcon />
                  {' '}
                  {t('remove', 'Remove')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
      {
        accessorKey: 'fullName',
        enableHiding: false,
        header: ({ column }) => {
          return (
            <Button
              variant='ghost'
              className='-ml-3'
              onClick={() => column.toggleSorting()}
            >
              {t('name', 'Name')}
              {getMultiSortIcon(column)}
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
              {t('payGrade', 'Pay Grade')}
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
        header: () => t('baseRate', 'Base Rate'),
      },
      {
        accessorKey: 'rateMultiplier',
        header: () => t('rateMultiplier', 'Rate Multiplier'),
        cell: info => info.getValue<number>().toFixed(2),
      },
      {
        accessorKey: 'effectiveRate',
        header: () => t('effectiveRate', 'Effective Rate'),
        cell: info =>
          info.getValue<number>()
            ? `${info.getValue<number>()}`
            : 'N/A',
      },
    ],
    [onRemoveMember, onUpdateMember, t],
  )

  const defaultHiddenColumns = useMemo(() => {
    return getHiddenColumns(defaultVisibleColumns, columns)
  }, [columns])

  return (
    <MembersDataTableSection
      columns={columns}
      data={members ? members.map(m => toTeamMemberUI(m)) : []}
      defaultHiddenColumns={defaultHiddenColumns}
    />
  )
}
