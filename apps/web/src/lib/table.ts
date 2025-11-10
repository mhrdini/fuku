import type { ColumnDef } from '@tanstack/react-table'

export const getHiddenColumns = (
  visibleColumnKeys: string[],
  allColumns: ColumnDef<any>[],
) => {
  return allColumns
    .filter(
      (col): col is ColumnDef<any> & { accessorKey: string } =>
        'accessorKey' in col,
    )
    .map(col => col.accessorKey)
    .filter(key => !visibleColumnKeys.includes(key))
}

export const prettifyHeader = (key: string): string => {
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2') // split camelCase
    .replace(/_/g, ' ') // split snake_case
    .replace(/\b\w/g, c => c.toUpperCase()) // capitalize words
    .trim()
}
