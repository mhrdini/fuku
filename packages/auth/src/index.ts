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
    user: {
      modelName: 'user', // matches @@map("user")
      fields: {
        emailVerified: 'email_verified',
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      },
    },
    session: {
      modelName: 'session',
      fields: {
        userId: 'user_id',
        expiresAt: 'expires_at',
        ipAddress: 'ip_address',
        userAgent: 'user_agent',
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      },
    },
    account: {
      modelName: 'account',
      fields: {
        accountId: 'account_id',
        providerId: 'provider_id',
        userId: 'user_id',
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
        idToken: 'id_token',
        accessTokenExpiresAt: 'access_token_expires_at',
        refreshTokenExpiresAt: 'refresh_token_expires_at',
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      },
    },
    verification: {
      modelName: 'verification',
      fields: {
        identifier: 'identifier',
        value: 'value',
        expiresAt: 'expires_at',
      },
    },
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
