import { useState } from 'react'
import { PayGradeOutputSchema } from '@fuku/db/schemas'
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
  DialogTrigger,
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
import { useQuery } from '@tanstack/react-query'
import {
  Column,
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table'
import { ChevronDown, Columns2, Plus, PlusCircle } from 'lucide-react'
import z from 'zod/v4'

import { useDashboardStore } from '~/store/dashboard'
import { useTRPC } from '~/trpc/client'

interface MembersDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  defaultHiddenColumns?: string[]
}

const PayGradeSchema = PayGradeOutputSchema.omit({
  team: true,
  teamMembers: true,
})
type PayGradeType = z.infer<typeof PayGradeSchema>

export function MembersDataTableSection<TData, TValue>({
  columns,
  data,
  defaultHiddenColumns = [],
}: MembersDataTableProps<TData, TValue>) {
  const trpc = useTRPC()
  const { currentTeamSlug } = useDashboardStore()

  const { data: payGrades, isPending: isLoadingPayGrades } = useQuery({
    ...trpc.payGrade.getAllByTeamSlug.queryOptions({
      teamSlug: currentTeamSlug!,
    }),
    enabled: !!currentTeamSlug,
  })

  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const [payGradeOpen, setPayGradeOpen] = useState(false)
  const [payGradeValues, setPayGradeValues] = useState(
    payGrades
      ? payGrades.reduce<Record<string, boolean>>((acc, pg) => {
          acc[pg.name] = false
          return acc
        }, {})
      : {},
  )

  const table = useReactTable({
    data,
    columns,
    enableHiding: true,
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
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

  const toggle = (column: Column<any, unknown>, value: string) => {
    const filterValue = (column.getFilterValue() as string[]) ?? []
    const newValues = filterValue.includes(value)
      ? filterValue.filter(v => v !== value)
      : [...filterValue, value]

    column.setFilterValue(newValues.length ? newValues : undefined)
    // undefined clears the filter
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
            <Separator orientation='vertical' />
            <Badge variant='outline'>
              {(table.getColumn('payGradeName')?.getFilterValue() as string[])
                ?.length ?? 0}
            </Badge>
          </Button>
        </PopoverTrigger>
        <PopoverContent align='start' className='p-0'>
          <Command>
            <CommandInput placeholder='Pay Grade' className='h-9' />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                {isLoadingPayGrades ? (
                  <Skeleton />
                ) : (
                  payGrades!.map(pg => (
                    <CommandItem
                      key={pg.id}
                      value={pg.name}
                      onSelect={value =>
                        toggle(table.getColumn('payGradeName')!, value)
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
                  ))
                )}
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
                  {column.columnDef.header as string}
                </DropdownMenuCheckboxItem>
              )
            })}
        </DropdownMenuContent>
      </DropdownMenu>
      <DialogTrigger asChild>
        <Button variant='outline'>
          <Plus />
          <span className='hidden lg:inline'>Add Member</span>
        </Button>
      </DialogTrigger>
    </>
  )

  return (
    <div>
      <div className='flex items-center py-4'>
        {tableFilters}
        <div className='ml-auto flex gap-2'>{tableActions}</div>
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
