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
