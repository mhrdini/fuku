import { TRPCError, TRPCRouterRecord } from '@trpc/server'
import { customAlphabet } from 'nanoid'
import z from 'zod/v4'

import {
  TeamCreateInputSchema,
  TeamUpdateInputSchema,
  UserTeam,
} from '../../schemas'
import { protectedProcedure } from '../../trpc'

const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 8)

export const teamRouter = {
  bySlug: protectedProcedure
    .input(z.object({ slug: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const team = await ctx.db.team.findFirst({
        where: {
          slug: input.slug,
          deletedAt: null,
          OR: [
            { adminUsers: { some: { id: ctx.session.user.id } } },
            {
              teamMembers: {
                some: { userId: ctx.session.user.id, deletedAt: null },
              },
            },
          ],
        },
        include: {
          teamMembers: { where: { deletedAt: null } },
        },
      })

      if (!team) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }

      return team
    }),
  getAllOwned: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id
    const teams = await ctx.db.team.findMany({
      where: {
        adminUsers: { some: { id: userId } },
        deletedAt: null,
      },
      include: {
        teamMembers: { where: { deletedAt: null } },
      },
    })

    return teams
  }),

  getUserTeams: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
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

    if (!user) return []

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

    const teams = [...byId.values()]
    return teams
  }),

  create: protectedProcedure
    .input(TeamCreateInputSchema)
    .mutation(async ({ input, ctx }) => {
      let slug: string
      while (true) {
        const candidate = nanoid()
        const existing = await ctx.db.team.findUnique({
          where: { slug: candidate },
        })
        if (!existing) {
          slug = candidate
          break
        }
      }

      const adminUserIds = input.teamMembers
        .filter(m => m.teamMemberRole === 'ADMIN' && m.userId)
        .map(m => ({ id: m.userId! }))

      const newTeam = await ctx.db.team.create({
        data: {
          slug,
          name: input.name,
          description: input.description,
          locations: {
            create: input.locations.map(l => ({
              name: l.name,
              ...(l.color && { color: l.color }),
            })),
          },
          shiftTypes: {
            create: input.shiftTypes.map(s => ({
              name: s.name,
              startTime: s.startTime,
              endTime: s.endTime,
            })),
          },
          adminUsers: {
            connect: adminUserIds,
          },
        },
        include: {
          adminUsers: true,
          locations: true,
          shiftTypes: true,
        },
      })

      // to map between payGradeClientId and payGradeId
      const payGrades = await Promise.all(
        input.payGrades.map(pg =>
          ctx.db.payGrade.create({
            data: {
              teamId: newTeam.id,
              name: pg.name,
              baseRate: pg.baseRate,
            },
          }),
        ),
      )

      const payGradeMap = new Map<string, string>()
      input.payGrades.forEach((pg, i) => {
        payGradeMap.set(pg.id, payGrades[i].id)
      })

      const teamMembers = await Promise.all(
        input.teamMembers.map(tm =>
          ctx.db.teamMember.create({
            data: {
              teamId: newTeam.id,
              userId: tm.userId ?? null,
              familyName: tm.familyName,
              givenNames: tm.givenNames,
              teamMemberRole: tm.teamMemberRole,
              rateMultiplier: tm.rateMultiplier,
              payGradeId: tm.payGradeClientId
                ? (payGradeMap.get(tm.payGradeClientId) ?? null)
                : null,
            },
          }),
        ),
      )

      ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: { lastActiveTeamId: newTeam.id },
      })

      return { ...newTeam, teamMembers, payGrades }
    }),

  update: protectedProcedure
    .input(TeamUpdateInputSchema)
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input
      const updatedCount = await ctx.db.team.updateMany({
        where: {
          id,
          deletedAt: null,
          adminUsers: { some: { id: ctx.session.user.id } },
        },
        data: {
          ...data,
          updatedAt: new Date(),
        },
      })

      if (updatedCount.count === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `No team with id '${id}' found or you do not have permission to update it`,
        })
      }

      return ctx.db.team.findUnique({ where: { id } })
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id
      const team = await ctx.db.team.findFirst({
        where: {
          id: input.id,
          deletedAt: null,
          adminUsers: { some: { id: userId } },
        },
        include: {
          teamMembers: true,
          locations: true,
          payGrades: true,
          shiftTypes: true,
        },
      })

      if (!team) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `No team with id '${input.id}' found or you do not have permission to delete it`,
        })
      }

      await ctx.db.shiftAssignment.deleteMany({
        where: {
          dayAssignment: {
            teamMember: { teamId: input.id },
          },
        },
      })

      await ctx.db.leaveAssignment.deleteMany({
        where: {
          dayAssignment: {
            teamMember: { teamId: input.id },
          },
        },
      })

      await ctx.db.dayAssignment.deleteMany({
        where: {
          teamMember: { teamId: input.id },
        },
      })

      await ctx.db.unavailability.deleteMany({
        where: {
          teamMember: { teamId: input.id },
        },
      })

      const now = new Date()

      await ctx.db.teamMember.updateMany({
        where: {
          teamId: input.id,
          deletedAt: null,
        },
        data: {
          deletedAt: now,
          deletedById: userId,
          payGradeId: null,
        },
      })

      await ctx.db.location.updateMany({
        where: {
          teamId: input.id,
          deletedAt: null,
        },
        data: {
          deletedAt: now,
          deletedById: userId,
        },
      })

      await ctx.db.shiftType.updateMany({
        where: {
          teamId: input.id,
          deletedAt: null,
        },
        data: {
          deletedAt: now,
          deletedById: userId,
        },
      })

      await ctx.db.payGrade.deleteMany({
        where: {
          teamId: input.id,
        },
      })

      const deletedCount = await ctx.db.team.updateMany({
        where: {
          id: input.id,
          deletedAt: null,
          adminUsers: { some: { id: userId } },
        },
        data: { deletedAt: now, deletedById: userId },
      })

      if (deletedCount.count === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `No team with id '${input.id}' found or you do not have permission to delete it`,
        })
      }

      const remainingTeams = await ctx.db.team.findMany({
        where: {
          deletedAt: null,
          OR: [
            { adminUsers: { some: { id: userId } } },
            { teamMembers: { some: { userId, deletedAt: null } } },
          ],
        },
        select: { id: true },
        orderBy: { createdAt: 'asc' },
      })

      const nextActiveTeamId =
        remainingTeams.length > 0 ? remainingTeams[0].id : null

      await ctx.db.user.update({
        where: { id: userId },
        data: { lastActiveTeamId: nextActiveTeamId },
      })

      return { team: team, activeTeamId: nextActiveTeamId, deletedAt: now }
    }),

  restore: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const restoredCount = await ctx.db.team.updateMany({
        where: {
          id: input.id,
          deletedAt: { not: null },
          adminUsers: { some: { id: ctx.session.user.id } },
        },
        data: { deletedAt: null, deletedById: null },
      })

      if (restoredCount.count === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `No deleted team with id '${input.id}' found or you do not have permission to restore it`,
        })
      }

      return ctx.db.team.findUnique({ where: { id: input.id } })
    }),
} satisfies TRPCRouterRecord
