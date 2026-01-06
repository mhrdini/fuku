export type TRPCUpdatePayload<T extends { id: string }> = {
  id: string
} & Partial<Omit<T, 'id'>>
