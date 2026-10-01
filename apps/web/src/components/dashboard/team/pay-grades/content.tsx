'use client'

import { useState } from 'react'

import { useTranslation } from '@fuku/i18n/react'
import {
  Button,
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxSeparator,
  ComboboxValue,
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
  useComboboxAnchor,
} from '@fuku/ui/components'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { EllipsisIcon, PlusIcon, TrashIcon } from 'lucide-react'

import type { ShiftTypeOutput } from '@fuku/api/schemas'
import type {
  ColumnDef,
} from '@tanstack/react-table'

import { EditableCell } from '~/components/ui/editable-cell'
import { DialogId } from '~/lib/dialog'
import type { PayGradeUI } from '~/lib/pay-grade'
import { SheetId } from '~/lib/sheet'
import { useDialogStore } from '~/store/dialog.store'
import { useSheetStore } from '~/store/sheet.store'
import { useTRPC } from '~/trpc/client'

export function TeamPayGradesContent() {
  const { t } = useTranslation()
  const [editingCell, setEditingCell] = useState<{
    rowId: string
    columnKey: string
  } | null>(null)

  const queryClient = useQueryClient()
  const trpc = useTRPC()

  const { data: team } = useQuery({
    ...trpc.team.getActiveTeam.queryOptions(),
  })

  const { data: payGrades } = useQuery({
    ...trpc.payGrade.list.queryOptions({ teamId: team?.id ?? '' }),
    enabled: !!team,
  })

  const { data: shiftTypes } = useQuery({
    ...trpc.shiftType.list.queryOptions({ teamId: team?.id ?? '' }),
    enabled: !!team,
  })

  const { mutateAsync: updatePayGrade, isPending: isUpdating } = useMutation({
    ...trpc.payGrade.update.mutationOptions(),
    onSuccess: (data) => {
      queryClient.setQueryData(
        trpc.payGrade.byId.queryKey({ id: data.id }),
        data,
      )
      queryClient.invalidateQueries(
        trpc.payGrade.list.queryOptions({ teamId: team?.id ?? '' }),
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
          <span className='sr-only'>{t('actions', 'Actions')}</span>
        </div>
      ),
      cell: ({ row }) => {
        const payGrade = row.original
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
                variant='destructive'
                onClick={() => {
                  onRemovePayGrade(payGrade.id)
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
      accessorKey: 'name',
      header: t('payGradeName', 'Pay Grade Name'),
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
    {
      accessorKey: 'eligibleShiftTypes',
      header: 'Shift Types',
      cell: ({ row }) => <EligibleShiftTypesCell payGrade={row.original} shiftTypes={shiftTypes} onUpdate={updatePayGrade} />,
    },
  ]

  const table = useReactTable({
    data: payGrades ?? [],
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
            {table.getRowModel().rows?.length
              ? (
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
                )
              : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className='h-24 text-center'
                    >
                      {t('noResults', 'No results.')}
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
          <PlusIcon />
          <span className='hidden sm:inline'>
            {t('newPayGrade', 'New pay grade')}
          </span>
        </Button>
      </div>
    </div>
  )
}

function EligibleShiftTypesCell({
  payGrade,
  shiftTypes,
  onUpdate,
}: {
  payGrade: PayGradeUI
  shiftTypes: ShiftTypeOutput[] | undefined
  onUpdate: (input: {
    id: string
    connectShiftTypes?: string[]
    disconnectShiftTypes?: string[]
  }) => void
}) {
  const { t } = useTranslation()
  const anchor = useComboboxAnchor()

  return (
    <Combobox
      multiple
      items={shiftTypes ?? []}
      value={payGrade.eligibleShiftTypes.map(st => st.shiftTypeId)}
      onValueChange={(ids: string[]) => {
        const connectShiftTypes = ids.filter(
          id =>
            !payGrade.eligibleShiftTypes.some(
              est => est.shiftTypeId === id,
            ),
        )

        const disconnectShiftTypes = payGrade.eligibleShiftTypes
          .filter(est => !ids.includes(est.shiftTypeId))
          .map(est => est.shiftTypeId)

        onUpdate({
          id: payGrade.id,
          connectShiftTypes,
          disconnectShiftTypes,
        })
      }}
    >
      <ComboboxChips ref={anchor} className='w-[300px] min-w-0'>
        <ComboboxValue>
          {(ids: string[]) => (
            <>
              {ids.map((id) => {
                const shiftType = shiftTypes?.find(st => st.id === id)

                if (!shiftType) {
                  return null
                }

                return (
                  <ComboboxChip key={id}>
                    {shiftType.name}
                  </ComboboxChip>
                )
              })}
              <ComboboxChipsInput />
            </>
          )}
        </ComboboxValue>
      </ComboboxChips>

      <ComboboxContent anchor={anchor}>
        <ComboboxEmpty>
          {t('noPayGradesFound', 'No pay grades found.')}
        </ComboboxEmpty>

        <ComboboxList>
          {item => (
            <ComboboxItem key={item.id} value={item.id}>
              {item.name}
            </ComboboxItem>
          )}
        </ComboboxList>

        <ComboboxSeparator className='m-0' />

        <div className='flex w-full flex-row justify-between'>
          <Button
            variant='link'
            className='text-muted-foreground hover:text-foreground px-3 text-center hover:no-underline'
            type='button'
            onClick={() =>
              onUpdate({
                id: payGrade.id,
                connectShiftTypes: shiftTypes?.map(st => st.id) ?? [],
              })}
          >
            {t('selectAll', 'Select all')}
          </Button>

          <Button
            variant='link'
            className='text-muted-foreground hover:text-foreground px-3 text-center hover:no-underline'
            type='button'
            onClick={() =>
              onUpdate({
                id: payGrade.id,
                disconnectShiftTypes: payGrade.eligibleShiftTypes.map(
                  est => est.shiftTypeId,
                ),
              })}
          >
            {t('clearAll', 'Clear all')}
          </Button>
        </div>
      </ComboboxContent>
    </Combobox>
  )
}
