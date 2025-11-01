import { Auth, Session } from '@fuku/auth'
import { db } from '@fuku/db'
import { initTRPC, TRPCError } from '@trpc/server'
import superjson from 'superjson'
import { z, ZodError } from 'zod/v4'

/**
 * 1. Context
 * This section defines "contexts" that will be accessible from every
 * tRPC procedures, such as database connections, authentication
 * information, and other utilities.
 */

export type TRPCContext = {
  authApi: Auth['api']
  session: Session | null
  db: typeof db
}

export const createTRPCContext = async (options: {
  headers: Headers
  auth: Auth
}): Promise<TRPCContext> => {
  const authApi = options.auth.api
  const session = await authApi.getSession({
    headers: options.headers,
  })
  return {
    authApi,
    session,
    db,
  }
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>

/**
 * 2. Initialization
 * This section initializes the tRPC API with the context defined above.
 */
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter: ({ shape, error }) => ({
    ...shape,
    data: {
      ...shape.data,
      zodError:
        error.cause instanceof ZodError
          ? z.flattenError(error.cause as ZodError<Record<string, unknown>>)
          : null,
    },
  }),
})

/**
 * 3. Routers & Procedures
 * This section defines the routers and procedures of the tRPC API.
 */
export const createTRPCRouter = t.router
export const createCallerFactory = t.createCallerFactory
export const publicProcedure = t.procedure
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
    },
  })
})
