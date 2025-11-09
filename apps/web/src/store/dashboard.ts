import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

type DashboardStore = {
  currentUsername: string | null
  setCurrentUsername: (username: string | null) => void
  currentTeamId: string | null
  currentTeamSlug: string | null
  setCurrentTeam: ({ id, slug }: { id?: string; slug?: string }) => void
}

export const useDashboardStore = create(
  persist<DashboardStore>(
    set => ({
      currentUsername: null,
      setCurrentUsername: (username: string | null) =>
        set({ currentUsername: username }),
      currentTeamId: null,
      currentTeamSlug: null,
      setCurrentTeam: ({ id, slug }) =>
        set({
          ...(id ? { currentTeamId: id } : {}),
          ...(slug ? { currentTeamSlug: slug } : {}),
        }),
    }),
    {
      name: 'dashboard',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
