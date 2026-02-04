'use client'

import { useState } from 'react'
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
  RowData,
  SortingState,
  useReactTable,
} from '@tanstack/react-table'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  PlusCircle,
  Settings2,
} from 'lucide-react'

import { TeamMemberUI } from '~/lib/member'
import { useDialogStore } from '~/store/dialog'
import { useTRPC } from '~/trpc/client'

import './create-member-form-dialog'

import { useParams } from 'next/navigation'

import { DialogId } from '~/lib/dialog'

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
  const { openDialog } = useDialogStore()
  const [payGradeOpen, setPayGradeOpen] = useState(false)
  const onCreateMember = () => {
    openDialog({ id: DialogId.CREATE_TEAM_MEMBER })
  }

  const trpc = useTRPC()
  const params = useParams()
  const slug = params?.slug as string
  const { data: team } = useQuery({
    ...trpc.team.bySlug.queryOptions({ slug: slug! }),
    enabled: !!slug,
  })
  const { data: payGrades } = useQuery({
    ...trpc.payGrade.listDetailed.queryOptions({ teamId: team!.id }),
    enabled: !!team,
  })

  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

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
                <Badge>
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
                {payGrades?.map(pg => (
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
            <Settings2 />
            <span className='hidden md:inline-flex'>View</span>
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
    </>
  )

  return (
    <div className='flex flex-col gap-2'>
      <div className='flex items-center'>
        {tableFilters}
        <div className='ml-auto flex gap-2'>{tableActions}</div>
      </div>
      <div className='table-container'>
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
                    <TableCell key={cell.id} className='cursor-default'>
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
          onClick={onCreateMember}
        >
          <Plus />
          <span className='hidden lg:inline'>New team member</span>
        </Button>
        <Button
          className='ml-auto'
          variant='outline'
          size='sm'
          aria-description='Go to previous page'
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          <ChevronLeft />
        </Button>
        <Button
          variant='outline'
          size='sm'
          aria-description='Go to next page'
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  )
}
