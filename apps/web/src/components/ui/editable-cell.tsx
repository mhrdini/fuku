import { JSX, memo, useState } from 'react'
import { Input } from '@fuku/ui/components'
import { Getter } from '@tanstack/react-table'

import { TRPCUpdatePayload } from '~/lib/db'

type EditableCellProps<
  DataType extends { id: string },
  ColumnKey extends keyof DataType,
  ReturnType = any,
> = {
  row: DataType
  columnName: ColumnKey
  renderValue: Getter<any>
  editingCell: { rowId: string; columnKey: string } | null
  setEditingCell: (cell: { rowId: string; columnKey: string } | null) => void
  onSave: (update: TRPCUpdatePayload<DataType>) => Promise<ReturnType>
  isUpdating: boolean
  children?: React.ReactNode
}

function EditableCellInner<
  DataType extends { id: string },
  ColumnKey extends keyof DataType,
  ReturnType = any,
>({
  row,
  columnName,
  editingCell,
  setEditingCell,
  onSave,
  children,
}: EditableCellProps<DataType, ColumnKey, ReturnType>) {
  const [value, setValue] = useState<string>(
    row[columnName] == null ? '' : String(row[columnName]),
  )

  const isEditing =
    editingCell?.rowId === row.id && editingCell?.columnKey === columnName

  const cancelChanges = () => {
    setValue(row[columnName] == null ? '' : String(row[columnName]))
    setEditingCell(null)
  }

  const saveChanges = async () => {
    try {
      const payload = {
        id: row.id,
        [columnName]: value === '' ? null : value,
      } as TRPCUpdatePayload<DataType>

      await onSave(payload)
    } finally {
      setEditingCell(null)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') cancelChanges()
    else if (e.key === 'Enter') saveChanges()
  }

  return (
    <div className='relative h-5 w-full min-w-0 overflow-hidden flex items-center'>
      {children ? (
        children
      ) : (
        <Input
          className='absolute inset-0 w-full h-full min-w-0 leading-none text-sm p-0 m-0 border-none rounded-none focus-visible:ring-0 shadow-none'
          value={value}
          autoFocus
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      )}
    </div>
  )
}

export const EditableCell = memo(EditableCellInner) as <
  DataType extends { id: string },
  ColumnKey extends keyof DataType,
  ReturnType = any,
>(
  props: EditableCellProps<DataType, ColumnKey, ReturnType>,
) => JSX.Element
