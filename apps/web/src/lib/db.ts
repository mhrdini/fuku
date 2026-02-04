export type TRPCUpdatePayload<T extends { id: string }> = {
  id: string
} & Partial<Omit<T, 'id'>>

export const isEntity = <T>(value: T | null | undefined): value is T =>
  value != null
