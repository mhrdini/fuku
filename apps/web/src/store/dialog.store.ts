import { create } from 'zustand'

import type { TeamMemberRole } from '@fuku/domain/schemas'

import type { DialogId } from '~/lib/dialog'

export type TeamMemberDraft = {
  givenNames: string
  familyName: string
  teamId?: string
  rateMultiplier: number
  teamMemberRole: TeamMemberRole
  payGradeId: string | null
  username?: string
}

type DialogOptions = {
  id: DialogId | null
  editingId?: string | null
  isAlert?: boolean
}

type FormOptions = {
  isDirty: boolean
  setIsDirty: (isDirty: boolean) => void
  createMemberDraft: TeamMemberDraft | null
  setCreateMemberDraft: (draft: TeamMemberDraft) => void
  clearCreateMemberDraft: () => void
}

type DialogStore = DialogOptions & FormOptions & {
  open: boolean
  discardOpen: boolean
  openDialog: (options: DialogOptions) => void
  openAlertDialog: (options: DialogOptions) => void
  closeDialog: () => void
  toggleDiscardDialog: () => void
}

export const useDialogStore = create<DialogStore>(set => ({
  open: false,
  discardOpen: false,
  id: null,
  editingId: null,
  isAlert: false,
  isDirty: false,
  setIsDirty: (isDirty: boolean) => set({ isDirty }),
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
  toggleDiscardDialog: () => set(state => ({ discardOpen: !state.discardOpen })),
  createMemberDraft: null,
  setCreateMemberDraft: (draft: TeamMemberDraft) => set(({ createMemberDraft: draft })),
  clearCreateMemberDraft: () => set({ createMemberDraft: null }),
}))
