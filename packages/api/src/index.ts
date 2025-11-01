import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server'

import type { AppRouter } from './routers/app'

type RouterInputs = inferRouterInputs<AppRouter>
type RouterOutputs = inferRouterOutputs<AppRouter>

// tRPC exports
export { createTRPCContext } from './trpc'

// Router exports
export type { AppRouter } from './routers/app'
export { appRouter } from './routers/app'
export type { RouterInputs, RouterOutputs }
