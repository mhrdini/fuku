import { TRPCError } from '@trpc/server'
import { customAlphabet } from 'nanoid'
import * as z from 'zod/v4'

import type { TeamOutput, UserTeam } from '../../schemas'
import type { TRPCRouterRecord } from '@trpc/server'

import {
  TeamCreateInputSchema,
  TeamOutputSchema,
  TeamUpdateInputSchema,
} from '../../schemas'
import {
  protectedProcedure,
  teamAdminProcedure,
} from '../../trpc'
import { resolveActiveTeam } from '../../utils/resolve-active-team'

const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 8)

export const teamRouter = {
  byId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const team = await ctx.db.team.findFirst({
        where: {
          id: input.id,
          deletedAt: null,
        },
      })

      if (!team) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }

      return TeamOutputSchema.parse(team)
    }),

  byPublicId: protectedProcedure
    .input(z.object({ publicId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const team = await ctx.db.team.findFirst({
        where: {
          publicId: input.publicId,
          deletedAt: null,
        },
      })

      if (!team) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }
      return TeamOutputSchema.parse(team)
    }),

  getActiveTeam: protectedProcedure.query(async ({ ctx }) => {
    const team = await resolveActiveTeam({ db: ctx.db, userId: ctx.session.user.id })

    return team ? TeamOutputSchema.parse(team) : null
  }),

  getAllOwned: protectedProcedure.query(async ({ ctx }) => {
    const teams = await ctx.db.team.findMany({
      where: {
        adminUsers: {
          some: { id: ctx.session.user.id },
        },
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    const parsedTeams: TeamOutput[] = teams.map(team =>
      TeamOutputSchema.parse(team),
    )

    return parsedTeams
  }),

  getUserTeams: protectedProcedure.query(async ({ ctx }) => {
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
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    })

    if (!user) {
      return []
    }

    const memberships = user.memberships
      .filter(m => m.team)
      .map((m) => {
        const { _count, ...data } = m.team

        return ({
          ...data,
          teamMembersCount: m.team._count.teamMembers,
          teamMemberRole: m.teamMemberRole,
        }) as UserTeam
      })

    return memberships
  }),

  create: protectedProcedure
    .input(TeamCreateInputSchema)
    .mutation(async ({ input, ctx }) => {
      let publicId: string

      while (true) {
        const candidate = nanoid()

        const existing = await ctx.db.team.findUnique({
          where: { publicId: candidate },
        })

        if (!existing) {
          publicId = candidate
          break
        }
      }

      const adminUserIds = input.teamMembers
        .filter(m => m.teamMemberRole === 'ADMIN' && m.userId !== undefined)
        .map(m => ({ id: m.userId }))

      const daysOfWeek = Array.from({ length: 7 }, (_, i) => i + 1)

      const newTeam = await ctx.db.team.create({
        data: {
          publicId,
          name: input.name,
          description: input.description,
          timeZone: input.timeZone,

          locations: {
            create: input.locations.map(location => ({
              name: location.name,
              ...(location.color && { color: location.color }),
            })),
          },

          shiftTypes: {
            create: input.shiftTypes.map(shiftType => ({
              name: shiftType.name,
              startTime: shiftType.startTime,
              endTime: shiftType.endTime,
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

      await Promise.all(
        daysOfWeek.map(day =>
          ctx.db.staffingRequirement.create({
            data: {
              teamId: newTeam.id,
              weekday: day,
            },
          }),
        ),
      )

      const payGrades = await Promise.all(
        input.payGrades.map(payGrade =>
          ctx.db.payGrade.create({
            data: {
              teamId: newTeam.id,
              name: payGrade.name,
              baseRate: payGrade.baseRate,
            },
          }),
        ),
      )

      const payGradeMap = new Map<string, string>()

      input.payGrades.forEach((payGrade, index) => {
        payGradeMap.set(payGrade.id, payGrades[index].id)
      })

      for (const [index, shift] of input.shiftTypes.entries()) {
        const shiftTypeId = newTeam.shiftTypes[index].id

        const eligiblePayGrades = shift.connectPayGrades?.map(id => ({
          payGradeId: payGradeMap.get(id)!,
          shiftTypeId,
        }))

        if (eligiblePayGrades?.length) {
          await ctx.db.payGradeShiftType.createMany({
            data: eligiblePayGrades,
            skipDuplicates: true,
          })
        }
      }

      const teamMembers = await Promise.all(
        input.teamMembers.map(teamMember =>
          ctx.db.teamMember.create({
            data: {
              teamId: newTeam.id,
              userId: teamMember.userId ?? null,
              familyName: teamMember.familyName,
              givenNames: teamMember.givenNames,
              teamMemberRole: teamMember.teamMemberRole,
              rateMultiplier: teamMember.rateMultiplier,
              payGradeId: teamMember.payGradeClientId
                ? (payGradeMap.get(teamMember.payGradeClientId) ?? null)
                : null,
            },
          }),
        ),
      )

      await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: { lastActiveTeamId: newTeam.id },
      })

      return {
        ...newTeam,
        teamMembers,
        payGrades,
      }
    }),

  update: teamAdminProcedure
    .input(TeamUpdateInputSchema)
    .mutation(async ({ input, ctx }) => {
      const { ...data } = input

      const updatedCount = await ctx.db.team.updateMany({
        where: {
          id: ctx.activeTeamId,
          deletedAt: null,
        },
        data: {
          ...data,
          updatedAt: new Date(),
        },
      })

      if (updatedCount.count === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Active team not found',
        })
      }

      return ctx.db.team.findUnique({
        where: { id: ctx.activeTeamId },
      })
    }),

  delete: teamAdminProcedure
    .mutation(async ({ ctx }) => {
      const teamId = ctx.activeTeamId
      const userId = ctx.session.user.id

      const team = await ctx.db.team.findFirst({
        where: {
          id: teamId,
          deletedAt: null,
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
          message: 'Active team not found',
        })
      }

      await ctx.db.shiftAssignment.deleteMany({
        where: {
          dayAssignment: {
            teamMember: {
              teamId,
            },
          },
        },
      })

      await ctx.db.leaveAssignment.deleteMany({
        where: {
          dayAssignment: {
            teamMember: {
              teamId,
            },
          },
        },
      })

      await ctx.db.dayAssignment.deleteMany({
        where: {
          teamMember: {
            teamId,
          },
        },
      })

      await ctx.db.unavailability.deleteMany({
        where: {
          teamMember: {
            teamId,
          },
        },
      })

      const now = new Date()

      await ctx.db.teamMember.updateMany({
        where: {
          teamId,
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
          teamId,
          deletedAt: null,
        },
        data: {
          deletedAt: now,
          deletedById: userId,
        },
      })

      await ctx.db.shiftType.updateMany({
        where: {
          teamId,
          deletedAt: null,
        },
        data: {
          deletedAt: now,
          deletedById: userId,
        },
      })

      await ctx.db.payGrade.deleteMany({
        where: {
          teamId,
        },
      })

      await ctx.db.team.updateMany({
        where: {
          id: teamId,
          deletedAt: null,
        },
        data: {
          deletedAt: now,
          deletedById: userId,
        },
      })

      const remainingTeams = await ctx.db.team.findMany({
        where: {
          deletedAt: null,
          OR: [
            {
              adminUsers: {
                some: { id: userId },
              },
            },
            {
              teamMembers: {
                some: {
                  userId,
                  deletedAt: null,
                },
              },
            },
          ],
        },
        select: {
          id: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      })

      const nextActiveTeamId
        = remainingTeams.length > 0
          ? remainingTeams[0].id
          : null

      await ctx.db.user.update({
        where: { id: userId },
        data: {
          lastActiveTeamId: nextActiveTeamId,
        },
      })

      return {
        team,
        activeTeamId: nextActiveTeamId,
        deletedAt: now,
      }
    }),

  restore: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const restoredCount = await ctx.db.team.updateMany({
        where: {
          id: input.id,
          deletedAt: { not: null },
          adminUsers: {
            some: { id: ctx.session.user.id },
          },
        },
        data: {
          deletedAt: null,
          deletedById: null,
        },
      })

      if (restoredCount.count === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `No deleted team with id '${input.id}' found or you do not have permission to restore it`,
        })
      }

      return ctx.db.team.findUnique({
        where: { id: input.id },
      })
    }),
} satisfies TRPCRouterRecord
