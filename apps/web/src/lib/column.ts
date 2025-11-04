import { ColumnDef } from '@tanstack/react-table'
import * as z from 'zod/v4'

export function zodToColumns<T extends z.ZodObject<any>>(
  schema: T,
): ColumnDef<z.infer<T>>[] {
  return Object.keys(schema.shape).map(key => ({
    accessorKey: key as keyof z.infer<T>,
    header: toTitleCase(key),
  }))
}

export function toTitleCase(str: string) {
  let result = str
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')

  result = result
    .split(' ')
    .map(word => {
      if (word.toLowerCase() === 'id') return 'ID' // special case
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')

  return result
}
