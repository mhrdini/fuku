'use client'

import type { AppRouter } from '@fuku/api'
import type { QueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { createTRPCClient, httpBatchStreamLink, loggerLink } from '@trpc/client'
import { createTRPCContext } from '@trpc/tanstack-react-query'
import superjson from 'superjson'

import { createQueryClient } from '~/trpc/query-client'

/**
 * Create and return tRPC client for React components (Client Side)
 */

let clientQueryClientSingleton: QueryClient | undefined = undefined
const getQueryClient = () => {
  if (typeof window === 'undefined') {
    // For server: always make a new query client
    return createQueryClient()
  } else {
    // Browser: make a new query client if we don't already have one
    // This is very important, so we don't re-make a new client if React
    // suspends during the initial render. This may not be needed if we
    // have a suspense boundary BELOW the creation of the query client
    return (clientQueryClientSingleton ??= createQueryClient())
  }
}

type TRPCContext = ReturnType<typeof createTRPCContext<AppRouter>>
const trpcContext: TRPCContext = createTRPCContext<AppRouter>()
export const useTRPC = trpcContext.useTRPC as typeof trpcContext.useTRPC
export const TRPCProvider =
  trpcContext.TRPCProvider as typeof trpcContext.TRPCProvider

export function TRPCReactProvider(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient()
  const [client] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        loggerLink({
          enabled: op =>
            process.env.NODE_ENV === 'development' ||
            (op.direction === 'down' && op.result instanceof Error),
        }),
        httpBatchStreamLink({
          url: getBaseUrl() + '/api/trpc',
          transformer: superjson,
          headers() {
            const headers = new Headers()
            headers.set('x-trpc-source', 'nextjs-react')
            return headers
          },
        }),
      ],
    }),
  )
  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={client} queryClient={queryClient}>
        {props.children}
      </TRPCProvider>
    </QueryClientProvider>
  )
}

const getBaseUrl = () => {
  if (typeof window !== 'undefined') return window.location.origin
  return `http://localhost:${process.env.PORT ?? 3000}`
}
