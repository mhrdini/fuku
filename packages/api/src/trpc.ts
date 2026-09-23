import { db } from '@fuku/db'
import { TeamMemberRoleValues } from '@fuku/domain/schemas'
import { DefaultSchedulerService } from '@fuku/scheduling'
/**
 * 3. Middlewares
 */
import { initTRPC, TRPCError } from '@trpc/server'
import superjson from 'superjson'
import { z, ZodError } from 'zod/v4'

import type { Auth, Session } from '@fuku/auth'
import type { SchedulerService } from '@fuku/scheduling'

import { PrismaTeamRepository } from './adapters/db/prisma-team.repository'
import { NagerHolidayService } from './adapters/holiday/nager-holiday.service'

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
  schedulerService: SchedulerService
}

export async function createTRPCContext(options: {
  headers: Headers
  auth: Auth
}): Promise<TRPCContext> {
  const authApi = options.auth.api
  const session = await authApi.getSession({
    headers: options.headers,
  })
  const teamRepository = new PrismaTeamRepository(db)
  const holidayService = new NagerHolidayService()
  const schedulerService = new DefaultSchedulerService(
    teamRepository,
    holidayService,
  )
  return {
    authApi,
    session,
    db,
    schedulerService,
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

const teamScopedMiddleware = authMiddleware.unstable_pipe(
  async ({ ctx, next }) => {
    const user = await ctx.db.user.findUnique({
      where: {
        id: ctx.session.user.id,
      },
      select: {
        lastActiveTeamId: true,
      },
    })

    if (!user?.lastActiveTeamId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'No active team',
      })
    }

    const membership = await ctx.db.teamMember.findFirst({
      where: {
        teamId: user.lastActiveTeamId,
        userId: ctx.session.user.id,
        deletedAt: null,
        team: {
          deletedAt: null,
        },
      },
      select: {
        id: true,
        teamId: true,
        teamMemberRole: true,
      },
    })

    if (!membership) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have access to the active team',
      })
    }

    return next({
      ctx: {
        activeTeamId: user.lastActiveTeamId,
        membership,
      },
    })
  },
)

const teamAdminMiddleware = teamScopedMiddleware.unstable_pipe(
  ({ ctx, next }) => {
    if (ctx.membership.teamMemberRole !== TeamMemberRoleValues.ADMIN) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Team admin access required',
      })
    }

    return next()
  },
)

/**
 * 4. Routers & Procedures
 * This section defines the routers and procedures of the tRPC API.
 */
export const createTRPCRouter = t.router
export const createCallerFactory = t.createCallerFactory
export const publicProcedure = t.procedure
export const protectedProcedure = t.procedure.use(authMiddleware)
export const teamScopedProcedure = protectedProcedure.use(
  teamScopedMiddleware,
)
export const teamAdminProcedure = teamScopedProcedure.use(
  teamAdminMiddleware,
)
