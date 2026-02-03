'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
import { Ellipsis, Plus, Trash } from 'lucide-react'

import { EditableCell } from '~/components/ui/editable-cell'
import { DialogId } from '~/lib/dialog'
import { LocationUI } from '~/lib/location'
import { SheetId } from '~/lib/sheet'
import { useDialogStore } from '~/store/dialog'
import { useSheetStore } from '~/store/sheet'
import { useTRPC } from '~/trpc/client'

export const TeamLocationsContent = () => {
  const params = useParams()
  const slug = params.slug as string
  const queryClient = useQueryClient()
  const trpc = useTRPC()

  const [editingCell, setEditingCell] = useState<{
    rowId: string
    columnKey: string
  } | null>(null)

  const { data: team } = useQuery({
    ...trpc.team.bySlug.queryOptions({ slug: slug! }),
    enabled: !!slug,
  })

  const { data } = useQuery({
    ...trpc.location.list.queryOptions({ teamId: team!.id }),
    enabled: !!team,
  })

  const { mutateAsync: updateLocation, isPending: isUpdating } = useMutation({
    ...trpc.location.update.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries(
        trpc.location.list.queryOptions({ teamId: team?.id! }),
      )
    },
  })

  const { openAlertDialog } = useDialogStore()
  const onRemoveLocation = async (id: string) => {
    openAlertDialog({
      id: DialogId.REMOVE_LOCATION,
      editingId: id,
    })
  }

  const { openSheet } = useSheetStore()
  const onNewLocation = () => {
    openSheet({ id: SheetId.CREATE_LOCATION })
  }

  const columns: ColumnDef<LocationUI, any>[] = [
    {
      id: 'actions',
      enableHiding: false,
      header: () => (
        <div>
          <span className='sr-only'>Actions</span>
        </div>
      ),
      cell: ({ row }) => {
        const location = row.original
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
                variant='destructive'
                onClick={() => {
                  onRemoveLocation(location.id)
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
    <div className='flex flex-col gap-2'>
      <div className='table-container'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow className='h-5' key={headerGroup.id}>
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
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='h-24 text-center'
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className='table-footer'>
        <Button
          variant='ghost'
          className='text-muted-foreground'
          onClick={onNewLocation}
        >
          <Plus /> New location
        </Button>
      </div>
    </div>
  )
}
