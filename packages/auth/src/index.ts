import type { BetterAuthOptions, BetterAuthPlugin } from 'better-auth'
import { db } from '@fuku/db'
import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'

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
    plugins: [...(options.extraPlugins ?? [])],
  }

  return betterAuth(config)
}

export type Auth = ReturnType<typeof initAuth>
export type Session = Auth['$Infer']['Session']
