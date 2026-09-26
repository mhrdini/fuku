import { TRPCError } from '@trpc/server'
import * as z from 'zod/v4'

import type { UserTeam } from '../schemas'
import type { TRPCRouterRecord } from '@trpc/server'

import { protectedProcedure } from '../trpc'

export const userRouter = {
  byId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const user = await ctx.db.user.findUnique({ where: { id: input.id } })
      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `No user with id '${input.id}'`,
        })
      }

      return user
    }),

  byUsername: protectedProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ input, ctx }) => {
      const user = await ctx.db.user.findUnique({
        where: { username: input.username },
      })
      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `No user with username '${input.username}'`,
        })
      }

      return user
    }),

  getMyMemberships: protectedProcedure.query(async ({ ctx }) => {
    const memberships = await ctx.db.teamMember.findMany({
      where: {
        userId: ctx.session.user.id,
        deletedAt: null,
        team: {
          deletedAt: null,
        },
      },
      orderBy: {
        team: {
          createdAt: 'asc',
        },
      },
    })

    return memberships
  }),

  getLastActiveTeam: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        lastActiveTeam: true,
        memberships: {
          where: {
            deletedAt: null,
            team: { deletedAt: null },
          },
          take: 1,
          orderBy: { createdAt: 'asc' },
          select: {
            team: true,
          },
        },
      },
    })

    if (!user)
      return null

    let lastActiveTeam = null

    // last active team
    if (user.lastActiveTeam) {
      lastActiveTeam = user.lastActiveTeam
    }

    // // member teams
    // if (user.memberships.length > 0 && user.memberships[0].team) {
    //   await ctx.db.user.update({
    //     where: { id: ctx.session.user.id },
    //     data: { lastActiveTeamId: user.memberships[0].team.id },
    //   })
    //   lastActiveTeam = user.memberships[0].team
    // }

    // no teams == null
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
        memberships: {
          where: {
            deletedAt: null,
            team: { deletedAt: null },
          },
          select: {
            team: {
              select: {
                id: true,
                publicId: true,
                name: true,
                description: true,
                createdAt: true,
                updatedAt: true,
                deletedAt: true,
                deletedById: true,
                timeZone: true,
                country: true,
                _count: {
                  select: {
                    teamMembers: {
                      where: { deletedAt: null },
                    },
                  },
                },
              },
            },
            teamMemberRole: true,
          },
        },
      },
    })

    if (!user) {
      return {
        teams: [],
        activeTeam: null,
      }
    }

    const teams = user.memberships
      .filter(m => m.team)
      .map((m) => {
        const { _count, ...data } = m.team

        return ({
          ...data,
          teamMembersCount: m.team._count.teamMembers,
          teamMemberRole: m.teamMemberRole,
        }) as UserTeam
      })

    let activeTeam = teams.find(t => t.id === user.lastActiveTeamId) ?? null

    if (!activeTeam && teams.length > 0) {
      activeTeam = teams[0]

      await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: { lastActiveTeamId: activeTeam.id },
      })
    }

    return {
      teams,
      activeTeam,
    }
  }),
} satisfies TRPCRouterRecord
