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
}

function EditableCellInner<
  DataType extends { id: string },
  ColumnKey extends keyof DataType,
  ReturnType = any,
>({
  row,
  columnName,
  renderValue,
  editingCell,
  setEditingCell,
  onSave,
  isUpdating,
}: EditableCellProps<DataType, ColumnKey, ReturnType>) {
  type ValueType = DataType[ColumnKey]
  const [value, setValue] = useState<ValueType>(row[columnName])

  const isEditing =
    editingCell?.rowId === row.id && editingCell?.columnKey === columnName

  const cancelChanges = () => {
    setValue(row[columnName])
    setEditingCell(null)
  }

  const saveChanges = async () => {
    try {
      const payload: TRPCUpdatePayload<DataType> = {
        id: row.id,
        [columnName]: value === null ? undefined : value,
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

  // TODO: Implement optimistic update to stop split second flicker when saving
  return (
    <div className='relative h-5 w-full min-w-0 overflow-hidden flex items-center'>
      {isEditing ? (
        <Input
          className='absolute inset-0 w-full h-full min-w-0 leading-none text-sm p-0 m-0 border-none rounded-none focus-visible:ring-0 shadow-none'
          value={String(value ?? '')}
          autoFocus
          onChange={e => setValue(e.target.value as unknown as ValueType)}
          onKeyDown={handleKeyDown}
        />
      ) : (
        <div
          className='cursor-text text-sm w-full h-full truncate block'
          onClick={e => {
            e.stopPropagation()
            setEditingCell({ rowId: row.id, columnKey: columnName as string })
          }}
        >
          {isEditing && isUpdating ? value : renderValue()}
        </div>
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
