import { create } from 'zustand'

import { SheetId } from '~/lib/sheet'

type SheetOptions = {
  id: SheetId | null
  editingId?: string | null
}

type SheetStore = SheetOptions & {
  openSheet: (options: SheetOptions) => void
  closeSheet: () => void
}

export const useSheetStore = create<SheetStore>(set => ({
  id: null,
  editingId: null,
  openSheet: ({ id }) => set({ id }),
  closeSheet: () => set({ id: null }),
}))
