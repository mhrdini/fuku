'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@fuku/ui/components'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'

import { EditableCell } from '~/components/ui/editable-cell'
import { LocationUI } from '~/lib/location'
import { useTRPC } from '~/trpc/client'

export const TeamLocationsContent = () => {
  const queryClient = useQueryClient()
  const trpc = useTRPC()
  const params = useParams()
  const currentTeamSlug = params.slug as string

  const [editingCell, setEditingCell] = useState<{
    rowId: string
    columnKey: string
  } | null>(null)

  const { data } = useQuery({
    ...trpc.location.getAllByTeam.queryOptions({
      teamSlug: currentTeamSlug!,
    }),
    enabled: !!currentTeamSlug,
  })

  const { mutateAsync: updateLocation, isPending: isUpdating } = useMutation({
    ...trpc.location.update.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.location.getAllByTeam.queryKey(),
      })
    },
  })

  const columns: ColumnDef<LocationUI, any>[] = [
    {
      accessorKey: 'name',
      header: 'Location Name',
      cell: ({ row, renderValue }) => (
        <EditableCell
          row={row.original}
          columnName='name'
          renderValue={renderValue}
          editingCell={editingCell}
          setEditingCell={setEditingCell}
          onSave={updateLocation}
          isUpdating={isUpdating}
        />
      ),
    },
    {
      accessorKey: 'address',
      header: 'Address',
      cell: ({ row, renderValue }) => (
        <EditableCell
          row={row.original}
          columnName='address'
          renderValue={renderValue}
          editingCell={editingCell}
          setEditingCell={setEditingCell}
          onSave={updateLocation}
          isUpdating={isUpdating}
        />
      ),
    },
  ]

  const table = useReactTable({
    data: data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className='overflow-hidden rounded-md border'>
      <Table className='table-fixed'>
        <TableHeader>
          {table.getHeaderGroups().map(headerGroup => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map(row => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && 'selected'}
              >
                {row.getVisibleCells().map(cell => (
                  <TableCell key={cell.id} className='relative'>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className='h-24 text-center'>
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
