import { createContext, use } from 'react'

import type { Session } from '@fuku/auth'

export const SessionContext = createContext<Session | null>(null)
export function useSession() {
  return use(SessionContext)
}
