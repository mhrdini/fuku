import { create } from 'zustand'

import { DialogId } from '~/lib/dialog'

type DialogOptions = {
  id: DialogId | null
  editingId?: string | null
  isAlert?: boolean
}

type DialogStore = DialogOptions & {
  open: boolean
  openDialog: (options: DialogOptions) => void
  openAlertDialog: (options: DialogOptions) => void
  closeDialog: () => void
}

export const useDialogStore = create<DialogStore>(set => ({
  open: false,
  id: null,
  editingId: null,
  isAlert: false,
  openDialog: ({ id, editingId = null, isAlert = false }) =>
    set({
      open: true,
      id,
      editingId,
      isAlert,
    }),
  openAlertDialog: ({ id, editingId = null }) =>
    set({
      open: true,
      id,
      editingId,
      isAlert: true,
    }),
  closeDialog: () => set({ open: false }),
}))
