'use client'

import type { JSX } from 'react'

import { memo, useState } from 'react'

import { useTranslation } from '@fuku/i18n/react'
import { Input } from '@fuku/ui/components'
import { TRPCClientError } from '@trpc/client'
import { toast } from 'sonner'

import type { Getter } from '@tanstack/react-table'

import type { TRPCUpdatePayload } from '~/lib/db'

type EditableCellProps<
  DataType extends { id: string },
  ColumnKey extends keyof DataType,
  ReturnType = any,
> = {
  row: DataType
  columnName: ColumnKey
  renderValue: Getter<any>
  editingCell: { rowId: string, columnKey: string } | null
  setEditingCell: (cell: { rowId: string, columnKey: string } | null) => void
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
  setEditingCell,
  onSave,
  children,
}: EditableCellProps<DataType, ColumnKey, ReturnType>) {
  const { t } = useTranslation()
  const [value, setValue] = useState<string>(
    row[columnName] === null ? '' : String(row[columnName]),
  )

  // const isEditing
  //   = editingCell?.rowId === row.id && editingCell?.columnKey === columnName

  const cancelChanges = () => {
    setValue(row[columnName] === null ? '' : String(row[columnName]))
    setEditingCell(null)
  }

  const saveChanges = async () => {
    try {
      const payload = {
        id: row.id,
        [columnName]: value === '' ? null : value,
      } as TRPCUpdatePayload<DataType>

      await onSave(payload)

      setEditingCell(null)
    } catch (error) {
      if (error instanceof TRPCClientError) {
        const zodError = error.data?.zodError
        const issue = zodError?.fieldErrors?.[columnName as string]?.[0]
        toast.error(t('error'), {
          description:
            issue
            ?? t('invalidValuePleaseTryAgain', 'Invalid value. Please try again.'),
        })
      } else {
        toast.error(t('error'), {
          description: t(
            'somethingWentWrongPleaseTryAgain',
            'Something went wrong. Please try again.',
          ),
        })
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape')
      cancelChanges()
    else if (e.key === 'Enter')
      saveChanges()
  }

  return (
    <div className='relative flex h-5 w-full min-w-0 items-center overflow-hidden'>
      {children || (
        <Input
          id={row.id}
          className='absolute inset-0 m-0 h-full w-full min-w-0 rounded-none border-none !bg-transparent p-0 text-sm leading-none shadow-none focus-visible:ring-0'
          value={value}
          autoFocus
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (value !== String(row[columnName] ?? ''))
              saveChanges()
            else cancelChanges()
          }}
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
