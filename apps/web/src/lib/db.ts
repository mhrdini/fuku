export type NullToUndefined<T> = {
  [K in keyof T]: T[K] extends null ? undefined : T[K]
}

export type TRPCUpdatePayload<T extends { id: string }> = {
  id: string
} & Partial<NullToUndefined<Omit<T, 'id'>>>
