import {
  inferAdditionalFields,
  usernameClient,
} from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'

import type { Auth } from '@fuku/auth'

export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<Auth>(), usernameClient()],
})
