import { createAuthClient } from 'better-auth/react' // make sure to import from better-auth/react

type AuthClient = ReturnType<typeof createAuthClient>
export const authClient: AuthClient = createAuthClient()
