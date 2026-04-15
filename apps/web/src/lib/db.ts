export type TRPCUpdatePayload<T extends { id: string }> = {
  id: string
} & Partial<Omit<T, 'id'>>

export const isEntity = <T>(value: T | null | undefined): value is T => !!value

export function getByIdMap<T extends { id: string }>(
  items: T[],
): Record<string, T> {
  return items.reduce<Record<string, T>>((acc, item) => {
    acc[item.id] = item
    return acc
  }, {})
}
