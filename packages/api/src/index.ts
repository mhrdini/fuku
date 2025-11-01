import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server'

import type { AppRouter } from './router/app'

type RouterInputs = inferRouterInputs<AppRouter>
type RouterOutputs = inferRouterOutputs<AppRouter>

export type { AppRouter } from './router/app'
export { appRouter } from './router/app'
export { createTRPCContext } from './trpc'
export type { RouterInputs, RouterOutputs }
