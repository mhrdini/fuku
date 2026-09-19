import { TeamMemberRoleValues } from '@fuku/domain/schemas'
import { create } from 'zustand'

import type { TeamMemberRole } from '@fuku/domain/schemas'

import type { DialogId } from '~/lib/dialog'

export type CreateMemberDraft = {
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

type DialogStore = DialogOptions & {
  open: boolean
  openDialog: (options: DialogOptions) => void
  openAlertDialog: (options: DialogOptions) => void
  closeDialog: () => void
  createMemberDraft: CreateMemberDraft
  setCreateMemberDraft: (draft: CreateMemberDraft) => void
  clearCreateMemberDraft: () => void
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
  createMemberDraft: {
    givenNames: '',
    familyName: '',
    teamId: '',
    rateMultiplier: 1,
    teamMemberRole: TeamMemberRoleValues.STAFF,
    payGradeId: null,
    username: '',
  },
  setCreateMemberDraft: (draft: CreateMemberDraft) => set(({ createMemberDraft: draft })),
  clearCreateMemberDraft: () => set({ createMemberDraft: {
    givenNames: '',
    familyName: '',
    teamId: '',
    rateMultiplier: 1,
    teamMemberRole: TeamMemberRoleValues.STAFF,
    payGradeId: null,
    username: '',
  } }),
}))
