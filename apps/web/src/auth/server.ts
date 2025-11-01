import 'server-only'

import { cache } from 'react'
import { headers } from 'next/headers'
import { initAuth } from '@fuku/auth'
import { nextCookies } from 'better-auth/next-js'

const baseUrl =
  process.env.NODE_ENV === 'production'
    ? process.env.PRODUCTION_URL || 'http://localhost:3000'
    : process.env.BASE_URL || 'http://localhost:3000'

export const auth = initAuth({
  baseUrl,
  secret: process.env.AUTH_SECRET,
  extraPlugins: [nextCookies()],
})

export const getSession = cache(async () =>
  auth.api.getSession({
    headers: await headers(),
  }),
)
