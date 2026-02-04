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
import { PayGradeUI } from '~/lib/payGrade'
import { SheetId } from '~/lib/sheet'
import { useDialogStore } from '~/store/dialog'
import { useSheetStore } from '~/store/sheet'
import { useTRPC } from '~/trpc/client'

export const TeamPayGradesContent = () => {
  const [editingCell, setEditingCell] = useState<{
    rowId: string
    columnKey: string
  } | null>(null)

  const queryClient = useQueryClient()
  const trpc = useTRPC()

  const params = useParams()
  const slug = params?.slug as string
  const { data: team } = useQuery({
    ...trpc.team.bySlug.queryOptions({ slug: slug! }),
    enabled: !!slug,
  })

  const { data } = useQuery({
    ...trpc.payGrade.listDetailed.queryOptions({ teamId: team!.id }),
    enabled: !!team,
  })

  const { mutateAsync: updatePayGrade, isPending: isUpdating } = useMutation({
    ...trpc.payGrade.update.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries(
        trpc.payGrade.listDetailed.queryOptions({ teamId: team!.id }),
      )
    },
  })

  const { openAlertDialog } = useDialogStore()
  const onRemovePayGrade = async (id: string) => {
    openAlertDialog({
      id: DialogId.REMOVE_PAY_GRADE,
      editingId: id,
    })
  }

  const { openSheet } = useSheetStore()
  const onNewPayGrade = () => {
    openSheet({ id: SheetId.CREATE_PAY_GRADE })
  }

  const columns: ColumnDef<PayGradeUI, any>[] = [
    {
      id: 'actions',
      enableHiding: false,
      header: () => (
        <div>
          <span className='sr-only'>Actions</span>
        </div>
      ),
      cell: ({ row }) => {
        const payGrade = row.original
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
                  onRemovePayGrade(payGrade.id)
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
      header: 'Pay Grade Name',
      cell: ({ row, renderValue }) => (
        <EditableCell
          row={row.original}
          columnName='name'
          renderValue={renderValue}
          editingCell={editingCell}
          setEditingCell={setEditingCell}
          onSave={updatePayGrade}
          isUpdating={isUpdating}
        />
      ),
    },
    {
      accessorKey: 'baseRate',
      header: 'Base Rate',
      cell: ({ row, renderValue }) => (
        <EditableCell
          row={row.original}
          columnName='baseRate'
          renderValue={renderValue}
          editingCell={editingCell}
          setEditingCell={setEditingCell}
          onSave={updatePayGrade}
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
          onClick={onNewPayGrade}
        >
          <Plus /> New pay grade
        </Button>
      </div>
    </div>
  )
}
