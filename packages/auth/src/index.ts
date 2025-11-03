import type { BetterAuthOptions, BetterAuthPlugin } from 'better-auth'
import { db } from '@fuku/db'
import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { username } from 'better-auth/plugins'

export function initAuth<
  TExtraPlugins extends BetterAuthPlugin[] = [],
>(options: {
  baseUrl: string
  secret: string | undefined
  extraPlugins?: TExtraPlugins
}) {
  const config: BetterAuthOptions = {
    database: prismaAdapter(db, {
      provider: 'postgresql',
    }),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      autoSignIn: true,
    },
    baseURL: options.baseUrl,
    secret: options.secret,
    plugins: [
      username({
        usernameValidator(username) {
          return /^[a-zA-Z0-9_-]+$/.test(username)
        },
        usernameNormalization: username => username.toLowerCase(),
        displayUsernameNormalization: displayUsername =>
          displayUsername.toLowerCase(),
        validationOrder: {
          username: 'post-normalization',
          displayUsername: 'post-normalization',
        },
      }),
      ...(options.extraPlugins ?? []),
    ],
  }

  return betterAuth(config)
}

export type Auth = ReturnType<typeof initAuth>

// TODO: Workaround for type issue in better-auth server auth session, but
// fine on client auth session though
export type Session = Auth['$Infer']['Session'] & {
  user: { username?: string }
}
