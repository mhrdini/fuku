import { TeamMemberRoleValues } from '@fuku/domain/schemas'
import { TRPCError } from '@trpc/server'
import * as z from 'zod/v4'

import type { UserOutput } from '../../schemas/auth'
import type { TRPCRouterRecord } from '@trpc/server'

import { TeamMemberCreateInputSchema, TeamMemberUpdateInputSchema } from '../../schemas'
import { teamAdminProcedure, teamScopedProcedure } from '../../trpc'

export const teamMemberRouter = {
  // source of truth for a member -> create / update / restore
  countActive: teamScopedProcedure
    .query(async ({ ctx }) => {
      return ctx.db.teamMember.count({
        where: {
          teamId: ctx.activeTeamId,
          deletedAt: null,
        },
      })
    }),

  byId: teamScopedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.teamMember.findFirst({
        where: {
          id: input.id,
          teamId: ctx.activeTeamId,
          deletedAt: null,
        },
        include: {
          payGrade: true,
          user: true,
        },
      })
    }),

  // Membership + ordering -> create / delete / restore

  listIds: teamScopedProcedure
    .input(
      z.object({
        limit: z.number().nonnegative().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.teamMember.findMany({
        where: {
          teamId: ctx.activeTeamId,
          deletedAt: null,
        },
        ...(input.limit && { take: input.limit }),
        orderBy: {
          createdAt: 'asc',
        },
        select: {
          id: true,
        },
      })
    }),

  // UI snapshot -> never invalidated

  list: teamScopedProcedure
    .input(
      z.object({
        limit: z.number().nonnegative().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.teamMember.findMany({
        where: {
          teamId: ctx.activeTeamId,
          deletedAt: null,
        },
        include: {
          payGrade: true,
          user: true,
        },
        orderBy: [
          { payGrade: { name: 'asc' } },
          { createdAt: 'asc' },
        ],
        ...(input.limit && { take: input.limit }),
      })
    }),

  create: teamAdminProcedure
    .input(TeamMemberCreateInputSchema)
    .mutation(async ({ input, ctx }) => {
      const { username, ...data } = input

      let userId: string | null = null
      if (username) {
        const user = await ctx.db.user.findUnique({
          where: {
            username,
          },
          include: {
            memberships: true,
          },
        })

        if (!user) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `No user "${username}" found`,
          })
        }

        if (user.memberships.some(membership => membership.teamId === ctx.activeTeamId)) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `User "${username}" already has member in team`,
          })
        }

        // it only updates last active team of linked user (as the current team)
        // iff the linked user === the session/calling user, i.e. the user creating the member
        if (user.id === ctx.session.user.id) {
          await ctx.db.user.update({
            where: {
              id: user.id,
            },
            data: {
              lastActiveTeamId: ctx.activeTeamId,
            },
          })
        }

        userId = user.id
      }

      return ctx.db.teamMember.create({
        data: {
          ...data,
          teamId: ctx.activeTeamId,
          userId,
        },
        include: {
          payGrade: true,
          user: true,
        },
      })
    }),

  update: teamAdminProcedure
    .input(TeamMemberUpdateInputSchema)
    .mutation(async ({ input, ctx }) => {
      const { id, username, ...data } = input

      const member = await ctx.db.teamMember.findFirst({
        where: {
          id,
          teamId: ctx.activeTeamId,
          deletedAt: null,
        },
      })

      if (!member) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `No team member with id '${id}' found`,
        })
      }

      let userId = member.userId
      let user: UserOutput | null = null

      // username: undefined -> keep the existing user association
      switch (username) {
        case undefined:
          break
        case null:
          // username: null -> unlink the existing user
          if (
            member.userId !== null
            && member.teamMemberRole === TeamMemberRoleValues.ADMIN
          ) {
            const activeAdminCount = await ctx.db.teamMember.count({
              where: {
                teamId: ctx.activeTeamId,
                teamMemberRole: TeamMemberRoleValues.ADMIN,
                deletedAt: null,
              },
            })

            if (activeAdminCount <= 1) {
              throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'Cannot unlink the last admin member of the team',
              })
            }
          }

          userId = null
          break
        default:
          // username: string -> link/reassign to the specified user
          user = await ctx.db.user.findUnique({
            where: { username },
          })

          if (!user) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: `No user found with username "${username}"`,
            })
          }

          // reassigning to the same user is a no-op
          if (user.id !== member.userId) {
            const existingMembership = await ctx.db.teamMember.findFirst({
              where: {
                teamId: ctx.activeTeamId,
                userId: user.id,
                deletedAt: null,
                id: { not: member.id },
              },
            })

            if (existingMembership) {
              throw new TRPCError({
                code: 'BAD_REQUEST',
                message: `User "${username}" is already a member of this team`,
              })
            }
          }

          userId = user.id
      }

      if (
        member.teamMemberRole === TeamMemberRoleValues.ADMIN
        && data.teamMemberRole !== undefined
        && data.teamMemberRole !== TeamMemberRoleValues.ADMIN
      ) {
        const activeAdminCount = await ctx.db.teamMember.count({
          where: {
            teamId: ctx.activeTeamId,
            teamMemberRole: TeamMemberRoleValues.ADMIN,
            deletedAt: null,
          },
        })

        if (activeAdminCount <= 1) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Cannot demote the last admin member of the team',
          })
        }
      }

      return ctx.db.teamMember.update({
        where: {
          id: member.id,
        },
        data: {
          ...data,
          userId,
        },
        include: {
          payGrade: true,
          user: true,
        },
      })
    }),

  delete: teamAdminProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const member = await ctx.db.teamMember.findFirst({
        where: {
          id: input.id,
          teamId: ctx.activeTeamId,
          deletedAt: null,
        },
      })

      if (!member) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `No active team member with id '${input.id}' found`,
        })
      }

      if (member.teamMemberRole === TeamMemberRoleValues.ADMIN) {
        const activeAdminCount = await ctx.db.teamMember.count({
          where: {
            teamId: ctx.activeTeamId,
            teamMemberRole: TeamMemberRoleValues.ADMIN,
            deletedAt: null,
          },
        })

        if (activeAdminCount <= 1) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Cannot delete the last admin member of the team',
          })
        }
      }

      return ctx.db.teamMember.update({
        where: {
          id: member.id,
        },
        data: {
          deletedAt: new Date(),
          deletedById: ctx.session.user.id,
        },
      })
    }),

  restore: teamAdminProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const member = await ctx.db.teamMember.findFirst({
        where: {
          id: input.id,
          teamId: ctx.activeTeamId,
          deletedAt: { not: null },
        },
      })

      if (!member) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `No deleted team member with id '${input.id}' found`,
        })
      }

      return ctx.db.teamMember.update({
        where: {
          id: member.id,
        },
        data: {
          deletedAt: null,
          deletedById: null,
        },
        include: {
          payGrade: true,
          user: true,
        },
      })
    }),
  leave: teamScopedProcedure
    .mutation(async ({ ctx }) => {
      const member = await ctx.db.teamMember.findFirst({
        where: {
          teamId: ctx.activeTeamId,
          userId: ctx.session.user.id,
          deletedAt: null,
        },
      })

      if (!member) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'You are not a member of this team',
        })
      }

      if (member.teamMemberRole === TeamMemberRoleValues.ADMIN) {
        const activeAdminCount = await ctx.db.teamMember.count({
          where: {
            teamId: ctx.activeTeamId,
            teamMemberRole: TeamMemberRoleValues.ADMIN,
            deletedAt: null,
          },
        })

        if (activeAdminCount <= 1) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Cannot leave the team as the only admin',
          })
        }
      }

      return ctx.db.teamMember.update({
        where: { id: member.id },
        data: {
          deletedAt: new Date(),
          deletedById: ctx.session.user.id,
        },
      })
    }),
} satisfies TRPCRouterRecord
