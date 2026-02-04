import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

type TeamStore = {
  activeTeamId: string | null
  setActiveTeamId: (id: string | null) => void
}

export const useTeamStore = create(
  persist<TeamStore>(
    set => ({
      activeTeamId: null,
      setActiveTeamId: (id: string | null) => set({ activeTeamId: id }),
    }),
    {
      name: 'team',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
