import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

type TeamMemberStore = {
  payGradeOpen: boolean
  setPayGradeOpen: (open: boolean) => void
  addDialogOpen: boolean
  setAddDialogOpen: (open: boolean) => void
  editDialogOpen: boolean
  setEditDialogOpen: (open: boolean) => void
  removeDialogOpen: boolean
  setRemoveDialogOpen: (open: boolean) => void
  currentTeamMemberId: string | null
  setCurrentTeamMemberId: (id: string | null) => void
}

export const useTeamMemberStore = create(
  persist<TeamMemberStore>(
    set => ({
      payGradeOpen: false,
      setPayGradeOpen: (open: boolean) => set({ payGradeOpen: open }),
      addDialogOpen: false,
      setAddDialogOpen: (open: boolean) => set({ addDialogOpen: open }),
      editDialogOpen: false,
      setEditDialogOpen: (open: boolean) => set({ editDialogOpen: open }),
      removeDialogOpen: false,
      setRemoveDialogOpen: (open: boolean) => set({ removeDialogOpen: open }),
      currentTeamMemberId: null,
      setCurrentTeamMemberId: (id: string | null) =>
        set({ currentTeamMemberId: id }),
    }),
    {
      name: 'team-member',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
