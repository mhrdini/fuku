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
import { TimeInput } from '~/components/ui/time-input'
import { DialogId } from '~/lib/dialog'
import { SheetId } from '~/lib/sheet'
import { ShiftTypeUI } from '~/lib/shift-types'
import { useDialogStore } from '~/store/dialog'
import { useSheetStore } from '~/store/sheet'
import { useTRPC } from '~/trpc/client'

export const TeamShiftTypesContent = () => {
  const queryClient = useQueryClient()
  const trpc = useTRPC()
  const params = useParams()
  const slug = params?.slug as string
  const { data: team } = useQuery({
    ...trpc.team.bySlug.queryOptions({ slug: slug! }),
    enabled: !!slug,
  })

  const [editingCell, setEditingCell] = useState<{
    rowId: string
    columnKey: string
  } | null>(null)

  const { data: shiftTypes } = useQuery({
    ...trpc.shiftType.listDetailed.queryOptions({ teamId: team!.id }),
    enabled: !!team,
  })

  const { mutateAsync: updateShiftType, isPending: isUpdating } = useMutation({
    ...trpc.shiftType.update.mutationOptions(),
    onSuccess: data => {
      queryClient.setQueryData(
        trpc.shiftType.byId.queryKey({ id: data.id }),
        data,
      )
      queryClient.invalidateQueries(
        trpc.shiftType.listDetailed.queryOptions({ teamId: team!.id }),
      )
    },
  })

  const updateTime = async ({
    id,
    timeType,
    time,
  }: {
    id: string
    timeType: 'startTime' | 'endTime'
    time: string
  }) => {
    await updateShiftType({
      id,
      [timeType]: time,
    })
  }

  const { openAlertDialog } = useDialogStore()
  const onRemoveShiftType = async (id: string) => {
    openAlertDialog({
      id: DialogId.REMOVE_SHIFT_TYPE,
      editingId: id,
    })
  }

  const { openSheet } = useSheetStore()
  const onNewShiftType = () => {
    openSheet({ id: SheetId.CREATE_SHIFT_TYPE })
  }

  const columns: ColumnDef<ShiftTypeUI, any>[] = [
    {
      id: 'actions',
      enableHiding: false,
      header: () => (
        <div>
          <span className='sr-only'>Actions</span>
        </div>
      ),
      cell: ({ row }) => {
        const shiftType = row.original
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
                onClick={() => onRemoveShiftType(shiftType.id)}
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
      header: 'Shift Type Name',
      cell: ({ row, renderValue }) => (
        <EditableCell
          row={row.original}
          columnName='name'
          renderValue={renderValue}
          editingCell={editingCell}
          setEditingCell={setEditingCell}
          onSave={updateShiftType}
          isUpdating={isUpdating}
        />
      ),
    },
    {
      accessorKey: 'startTime',
      header: 'Start Time',
      cell: ({ row }) => {
        return (
          <TimeInput
            id={row.original.id}
            timeType='startTime'
            value={row.original.startTime}
            onChange={updateTime}
          />
        )
      },
    },
    {
      accessorKey: 'endTime',
      header: 'End Time',
      cell: ({ row }) => {
        return (
          <TimeInput
            id={row.original.id}
            timeType='endTime'
            value={row.original.endTime}
            onChange={updateTime}
          />
        )
      },
    },
  ]

  const table = useReactTable({
    data: shiftTypes ?? [],
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
          onClick={onNewShiftType}
        >
          <Plus /> New shift type
        </Button>
      </div>
    </div>
  )
}
