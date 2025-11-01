import type { AppRouter } from '@fuku/api'
import { cache } from 'react'
import { headers } from 'next/headers'
import { appRouter, createTRPCContext } from '@fuku/api'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import {
  createTRPCOptionsProxy,
  TRPCQueryOptions,
} from '@trpc/tanstack-react-query'

import { auth } from '~/auth/server'
import { createQueryClient } from '~/trpc/query-client'

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling a tRPC call from a React Server Component.
 */
const createContext = cache(async () => {
  const h = new Headers(await headers())
  h.set('x-trpc-source', 'rsc')

  return createTRPCContext({
    headers: h,
    auth,
  })
})

const getQueryClient = cache(createQueryClient)

type TRPC = ReturnType<typeof createTRPCOptionsProxy<AppRouter>>
export const trpc: TRPC = createTRPCOptionsProxy<AppRouter>({
  router: appRouter,
  ctx: createContext,
  queryClient: getQueryClient,
})

export function HydrateClient(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient()
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {props.children}
    </HydrationBoundary>
  )
}
export function prefetch<T extends ReturnType<TRPCQueryOptions<any>>>(
  queryOptions: T,
) {
  const queryClient = getQueryClient()
  if (queryOptions.queryKey[1]?.type === 'infinite') {
    void queryClient.prefetchInfiniteQuery(queryOptions as any)
  } else {
    void queryClient.prefetchQuery(queryOptions)
  }
}
