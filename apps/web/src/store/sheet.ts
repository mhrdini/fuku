import { create } from 'zustand'

import { SheetId } from '~/lib/sheet'

type SheetStore = {
  id: SheetId | null
  openSheet: (id: SheetId) => void
  closeSheet: () => void
  editingId: string | null
}

export const useSheetStore = create<SheetStore>(set => ({
  id: null,
  openSheet: id => set({ id }),
  closeSheet: () => set({ id: null }),
  editingId: null,
}))
