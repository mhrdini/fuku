'use client'

import { createContext, useContext } from 'react'
import { Session } from '@fuku/auth'

interface SessionProviderProps {
  session: Session | null
  children: React.ReactNode
}

const SessionContext = createContext<Session | null>(null)

export function SessionProvider({ session, children }: SessionProviderProps) {
  return (
    <SessionContext.Provider value={session}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  return useContext(SessionContext)
}
