'use client'

import type { Session } from '@fuku/auth'

import { SessionContext } from './session-context'

type SessionProviderProps = {
  session: Session | null
  children: React.ReactNode
}

export function SessionProvider({ session, children }: SessionProviderProps) {
  return (
    <SessionContext value={session}>
      {children}
    </SessionContext>
  )
}
