import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

type DashboardStore = {
  currentUsername: string | null
  setCurrentUsername: (username: string | null) => void
  currentTeamSlug: string | null
  setCurrentTeamSlug: (id: string | null) => void
}

export const useDashboardStore = create(
  persist<DashboardStore>(
    set => ({
      currentUsername: null,
      setCurrentUsername: (username: string | null) =>
        set({ currentUsername: username }),
      currentTeamSlug: null,
      setCurrentTeamSlug: (teamSlug: string | null) =>
        set({ currentTeamSlug: teamSlug }),
    }),
    {
      name: 'team',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
