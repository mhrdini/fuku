import type { Auth } from '@fuku/auth'
import {
  inferAdditionalFields,
  usernameClient,
} from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<Auth>(), usernameClient()],
})
