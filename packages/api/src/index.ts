import type { AppRouter } from './routers/app'
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server'

type RouterInputs = inferRouterInputs<AppRouter>
type RouterOutputs = inferRouterOutputs<AppRouter>

// Router exports
export type { AppRouter } from './routers/app'

export { appRouter } from './routers/app'
// tRPC exports
export { createTRPCContext } from './trpc'
export type { RouterInputs, RouterOutputs }

// Helper exports
export { resolveActiveTeam } from './utils/resolve-active-team'
