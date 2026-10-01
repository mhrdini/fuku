import type { Auth, Session } from '@fuku/auth'

export function createTestAuthApi(
  session: Session | null = null,
): Auth['api'] {
  return {
    getSession: async () => session,
  } as Auth['api']
}
