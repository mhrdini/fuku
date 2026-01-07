import { Auth, Session } from '@fuku/auth'
import { db } from '@fuku/db'
/**
 * 3. Middlewares
 */
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
  activeTeamId: string | null
  activeTeamSlug: string | null
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
    activeTeamId: null,
    activeTeamSlug: null,
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
 * 3. Middlewares
 */
const authMiddleware = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
    },
  })
})

const activeTeamMiddleware = t.middleware(async ({ ctx, next }) => {
  const user = ctx.session?.user
  if (!user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }

  const dbUser = await ctx.db.user.findUnique({
    where: { id: user.id },
    select: {
      lastActiveTeam: {
        select: {
          id: true,
          slug: true,
          deletedAt: true,
          adminUsers: { where: { id: user.id }, select: { id: true } },
          teamMembers: {
            where: { userId: user.id, deletedAt: null },
            select: { id: true },
          },
        },
      },
    },
  })

  let team = dbUser?.lastActiveTeam

  const isValidTeam =
    team &&
    !team.deletedAt &&
    (team.adminUsers.length > 0 || team.teamMembers.length > 0)

  if (!isValidTeam) {
    const fallbackTeam = await ctx.db.team.findFirst({
      where: {
        deletedAt: null,
        OR: [
          { adminUsers: { some: { id: user.id } } },
          { teamMembers: { some: { userId: user.id, deletedAt: null } } },
        ],
      },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        slug: true,
        deletedAt: true,
        adminUsers: { where: { id: user.id }, select: { id: true } },
        teamMembers: {
          where: { userId: user.id, deletedAt: null },
          select: { id: true },
        },
      },
    })

    if (!fallbackTeam) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'User does not belong to any team',
      })
    }

    await ctx.db.user.update({
      where: { id: user.id },
      data: { lastActiveTeamId: fallbackTeam.id },
    })

    team = fallbackTeam
  }

  if (!team) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Active team resolution failed',
    })
  }

  return next({
    ctx: {
      activeTeamId: team.id,
      activeTeamSlug: team.slug,
    },
  })
})

/**
 * 4. Routers & Procedures
 * This section defines the routers and procedures of the tRPC API.
 */
export const createTRPCRouter = t.router
export const createCallerFactory = t.createCallerFactory
export const publicProcedure = t.procedure
export const protectedProcedure = t.procedure.use(authMiddleware)
export const teamProcedure = protectedProcedure.use(activeTeamMiddleware)
