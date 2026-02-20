import { create } from 'zustand'

import { SheetId } from '~/lib/sheet'

type SheetOptions = {
  id: SheetId | null
  editingId?: string | null
}

type SheetStore = SheetOptions & {
  open: boolean
  openSheet: (options: SheetOptions) => void
  closeSheet: () => void
}

export const useSheetStore = create<SheetStore>(set => ({
  id: null,
  editingId: null,
  open: false,
  openSheet: ({ id, editingId }) => set({ open: true, id, editingId }),
  closeSheet: () => set({ open: false }),
}))
