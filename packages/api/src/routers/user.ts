import { TRPCError, TRPCRouterRecord } from '@trpc/server'
import z from 'zod/v4'

import { UserTeam } from '../schemas'
import { protectedProcedure } from '../trpc'

export const userRouter = {
  byId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const user = await ctx.db.user.findUnique({ where: { id: input.id } })
      if (!user)
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `No user with id '${input.id}'`,
        })

      return user
    }),

  byUsername: protectedProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ input, ctx }) => {
      if (!input.username)
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Username is required',
        })

      const user = await ctx.db.user.findUnique({
        where: { username: input.username },
      })
      if (!user)
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `No user with username '${input.username}'`,
        })

      return user
    }),

  getMyMemberships: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id
    const memberships = await ctx.db.teamMember.findMany({
      where: { userId, deletedAt: null, team: { deletedAt: null } },
      include: { team: true, payGrade: true },
    })
    return memberships
  }),

  getLastActiveTeam: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        lastActiveTeam: {
          select: {
            id: true,
            slug: true,
            name: true,
            description: true,
            teamMembers: true,
          },
        },
        ownedTeams: {
          where: { deletedAt: null },
          take: 1,
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            slug: true,
            name: true,
            description: true,
            teamMembers: true,
          },
        },
        memberships: {
          where: {
            deletedAt: null,
            team: { deletedAt: null },
          },
          take: 1,
          orderBy: { createdAt: 'asc' },
          select: {
            team: {
              select: {
                id: true,
                slug: true,
                name: true,
                description: true,
                teamMembers: true,
              },
            },
          },
        },
      },
    })

    if (!user) return null

    let lastActiveTeam = null

    // last active team
    if (user.lastActiveTeam) {
      lastActiveTeam = user.lastActiveTeam
    }

    // owned teams
    if (user.ownedTeams.length > 0) {
      await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: { lastActiveTeamId: user.ownedTeams[0].id },
      })
      lastActiveTeam = user.ownedTeams[0]
    }

    // member teams
    if (user.memberships.length > 0 && user.memberships[0].team) {
      await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: { lastActiveTeamId: user.memberships[0].team.id },
      })
      lastActiveTeam = user.memberships[0].team
    }

    // no teams
    return lastActiveTeam
  }),

  setLastActiveTeam: protectedProcedure
    .input(z.object({ teamId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id
      const team = await ctx.db.team.findFirst({
        where: {
          id: input.teamId,
          deletedAt: null,
          OR: [
            { adminUsers: { some: { id: userId } } },
            { teamMembers: { some: { userId, deletedAt: null } } },
          ],
        },
      })

      if (!team) {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }

      await ctx.db.user.update({
        where: { id: userId },
        data: { lastActiveTeamId: team.id },
      })

      return team
    }),

  getSidebarState: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        lastActiveTeamId: true,
        ownedTeams: {
          where: { deletedAt: null },
          select: {
            id: true,
            slug: true,
            name: true,
            description: true,
            teamMembers: true,
            createdAt: true,
          },
        },
        memberships: {
          where: {
            deletedAt: null,
            team: { deletedAt: null },
          },
          select: {
            team: {
              select: {
                id: true,
                slug: true,
                name: true,
                description: true,
                teamMembers: true,
                createdAt: true,
              },
            },
            teamMemberRole: true,
          },
        },
      },
    })

    if (!user)
      return {
        teams: [],
        activeTeam: null,
      }

    const owned: UserTeam[] = user.ownedTeams.map(team => ({
      id: team.id,
      slug: team.slug,
      name: team.name,
      description: team.description,
      teamMembers: team.teamMembers,
      createdAt: team.createdAt,
      role: 'ADMIN',
    }))

    const member: UserTeam[] = user.memberships
      .filter(m => m.team)
      .map(m => ({
        id: m.team!.id,
        slug: m.team!.slug,
        name: m.team!.name,
        description: m.team!.description,
        teamMembers: m.team!.teamMembers,
        createdAt: m.team!.createdAt,
        role: m.teamMemberRole, // STAFF or ADMIN
      }))

    // Deduplicate by team id (owned team might also appear as membership)
    const byId = new Map<string, UserTeam>()

    for (const t of member) byId.set(t.id, t)
    for (const t of owned) byId.set(t.id, t)

    const teams: UserTeam[] = [...byId.values()]
    return {
      teams,
      activeTeam: teams.find(t => t.id === user.lastActiveTeamId) || null,
    }
  }),
} satisfies TRPCRouterRecord
