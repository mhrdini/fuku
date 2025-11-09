import { Suspense, useState } from 'react'
import {
  Badge,
  Button,
  Checkbox,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Separator,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@fuku/ui/components'
import { useSuspenseQuery } from '@tanstack/react-query'
import {
  Column,
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  RowData,
  SortingState,
  useReactTable,
} from '@tanstack/react-table'
import { ChevronDown, Columns2, Plus, PlusCircle } from 'lucide-react'

import { useDashboardStore } from '~/store/dashboard'
import { useTeamMemberStore } from '~/store/member'
import { useTRPC } from '~/trpc/client'
import { AddMemberFormDialog } from './add-member-form-dialog'
import { TeamMemberUI } from './content'

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData extends RowData, TValue> {
    label: string
  }
}

interface MembersDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  defaultHiddenColumns?: string[]
}

export function MembersDataTableSection({
  data,
  columns,
  defaultHiddenColumns,
}: MembersDataTableProps<TeamMemberUI, any>) {
  const trpc = useTRPC()
  const { currentTeamSlug } = useDashboardStore()

  const { data: payGrades } = useSuspenseQuery(
    trpc.payGrade.getAllByTeamSlug.queryOptions({
      teamSlug: currentTeamSlug!,
    }),
  )

  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const [payGradeOpen, setPayGradeOpen] = useState(false)
  const { addDialogOpen, setAddDialogOpen } = useTeamMemberStore()

  const onAddMemberClick = () => {
    setAddDialogOpen(true)
  }

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    enableSortingRemoval: true,
    enableMultiSort: true,
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    enableHiding: true,
    state: {
      sorting,
      columnFilters,
    },
    ...(defaultHiddenColumns && {
      initialState: {
        columnVisibility: defaultHiddenColumns.reduce(
          (acc, colId) => {
            acc[colId] = false
            return acc
          },
          {} as Record<string, boolean>,
        ),
      },
    }),
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  const toggleFilter = (column: Column<any, unknown>, value: string) => {
    const filterValue = (column.getFilterValue() as string[]) ?? []
    const newValues = filterValue.includes(value)
      ? filterValue.filter(v => v !== value)
      : [...filterValue, value]

    // undefined clears the filter
    column.setFilterValue(newValues.length ? newValues : undefined)
  }

  const tableFilters = (
    <>
      <Popover open={payGradeOpen} onOpenChange={setPayGradeOpen}>
        <PopoverTrigger asChild>
          <Button
            variant='outline'
            role='combobox'
            className='justify-between border-dashed py-0'
          >
            <PlusCircle />
            Pay Grade
            {(table.getColumn('payGradeName')?.getFilterValue() as string[])
              ?.length > 0 && (
              <>
                <Separator orientation='vertical' />
                <Badge variant='outline'>
                  {(
                    table
                      .getColumn('payGradeName')
                      ?.getFilterValue() as string[]
                  )?.length || 0}
                </Badge>
              </>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align='start' className='p-0'>
          <Command>
            <CommandInput placeholder='Pay Grade' className='h-9' />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                <Suspense fallback={<Skeleton className='h-8 w-full' />}>
                  {payGrades!.map(pg => (
                    <CommandItem
                      key={pg.id}
                      value={pg.name}
                      onSelect={value =>
                        toggleFilter(table.getColumn('payGradeName')!, value)
                      }
                      asChild
                    >
                      <div>
                        <Checkbox
                          id={pg.id}
                          value={pg.name}
                          checked={(
                            (table
                              .getColumn('payGradeName')
                              ?.getFilterValue() as string[]) ?? []
                          ).includes(pg.name)}
                        />
                        <Label htmlFor={pg.id} asChild>
                          <Badge variant='outline'>{pg.name}</Badge>
                        </Label>
                      </div>
                    </CommandItem>
                  ))}
                </Suspense>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                <Button
                  variant='ghost'
                  className='w-full justify-center font-normal'
                  onClick={() => {
                    table.getColumn('payGradeName')?.setFilterValue(undefined)
                  }}
                >
                  Clear filters
                </Button>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </>
  )
  const tableActions = (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='outline'>
            <Columns2 />
            <span className='hidden lg:inline'>Customize Columns</span>
            <span className='lg:hidden'>Columns</span>
            <ChevronDown />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          {table
            .getAllColumns()
            .filter(column => column.getCanHide())
            .map(column => {
              return (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className='capitalize'
                  checked={column.getIsVisible()}
                  onCheckedChange={value => column.toggleVisibility(!!value)}
                >
                  {column.columnDef.meta?.label as string}
                </DropdownMenuCheckboxItem>
              )
            })}
        </DropdownMenuContent>
      </DropdownMenu>
      <Button variant='outline' onClick={onAddMemberClick}>
        <Plus />
        <span className='hidden lg:inline'>Add Member</span>
      </Button>
    </>
  )

  return (
    <div>
      <div className='flex items-center py-4'>
        {tableFilters}
        <div className='ml-auto flex gap-2'>{tableActions}</div>
        <AddMemberFormDialog
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
        />
      </div>
      <div className='overflow-hidden rounded-md border'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.meta?.label ??
                              header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  )
                })}
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
      <div className='flex items-center justify-end space-x-2 py-4'>
        <Button
          variant='outline'
          size='sm'
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant='outline'
          size='sm'
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
