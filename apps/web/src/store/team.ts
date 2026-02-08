import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

type TeamStore = {
  openTeamSelect: boolean
  setOpenTeamSelect: (openTeamSelect: boolean) => void
  activeTeamId: string | null
  setActiveTeamId: (id: string | null) => void
}

export const useTeamStore = create(
  persist<TeamStore>(
    set => ({
      openTeamSelect: false,
      setOpenTeamSelect: (openTeamSelect: boolean) => set({ openTeamSelect }),
      activeTeamId: null,
      setActiveTeamId: (id: string | null) => set({ activeTeamId: id }),
    }),
    {
      name: 'team',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
