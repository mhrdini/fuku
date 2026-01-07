import { redirect } from 'next/navigation'
import {
  defaultShouldDehydrateQuery,
  QueryCache,
  QueryClient,
} from '@tanstack/react-query'
import { TRPCClientError } from '@trpc/client'
import superjson from 'superjson'

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
      },
      dehydrate: {
        serializeData: superjson.serialize,
        shouldDehydrateQuery: query =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === 'pending',
        shouldRedactErrors: () => {
          return false
        },
      },
      hydrate: {
        deserializeData: superjson.deserialize,
      },
    },
    queryCache: new QueryCache({
      onError(error) {
        if (!(error instanceof TRPCClientError)) return

        switch (error.data?.code) {
          case 'UNAUTHORIZED':
            redirect('/login')

          case 'FORBIDDEN':
            redirect('/')

          case 'INTERNAL_SERVER_ERROR':
            redirect('/error')
        }
      },
    }),
  })
