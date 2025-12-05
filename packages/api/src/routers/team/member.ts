import { TeamMemberRole } from '@fuku/db'
import { TeamMemberSchema } from '@fuku/db/schemas'
import { TRPCError, TRPCRouterRecord } from '@trpc/server'
import z from 'zod/v4'

import { protectedProcedure } from '../../trpc'

export const teamMemberRouter = {
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const member = await ctx.db.teamMember.findUnique({
        where: { id: input.id },
        include: { user: true, payGrade: true },
      })

      if (!member)
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `No team member with id '${input.id}'`,
        })

      return member
    }),

  getAllByTeam: protectedProcedure
    .input(
      z.object({
        teamId: z.string(),
        limit: z.number().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      // Fetch members
      const members = await ctx.db.teamMember.findMany({
        where: { teamId: input.teamId, deletedAt: null },
        include: { user: true, payGrade: true },
        ...(input.limit && { take: input.limit }),
        orderBy: [
          { payGrade: { name: 'asc' } },
          { createdAt: 'asc' },
          { givenNames: 'asc' },
          { familyName: 'asc' },
        ],
      })

      return members
    }),

  create: protectedProcedure
    .input(
      TeamMemberSchema.omit({
        id: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        deletedById: true,
      }).extend({
        username: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { username, ...data } = input

      let userId: string | null = null
      if (username) {
        const user = await ctx.db.user.findUnique({
          where: { username },
        })
        if (!user) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `No user found with username "${username}"`,
          })
        }
        userId = user.id
      }

      const newMember = await ctx.db.teamMember.create({
        data: {
          ...data,
          userId,
        },
      })
      return newMember
    }),

  update: protectedProcedure
    .input(
      TeamMemberSchema.partial().extend({
        id: z.string(),
        username: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { id, username, ...data } = input

      const currentUserId = ctx.session.user.id

      let userId: string | null = null
      if (username) {
        const user = await ctx.db.user.findUnique({
          where: { username },
        })
        if (!user) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `No user found with  "${username}"`,
          })
        }
        userId = user.id
      }

      const updated = await ctx.db.teamMember.update({
        where: {
          id,
          deletedAt: null,
          team: {
            deletedAt: null,
            adminUsers: { some: { id: currentUserId } },
          },
        },
        data: {
          ...data,
          userId,
        },
      })

      if (!updated)
        throw new TRPCError({
          code: 'FORBIDDEN',
          message:
            'Cannot edit this team member (not found, deleted, or insufficient permissions)',
        })

      return updated
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { id } = input
      const currentUserId = ctx.session.user.id

      const member = await ctx.db.teamMember.findFirst({
        where: {
          id,
          deletedAt: null,
          team: {
            deletedAt: null,
            adminUsers: { some: { id: currentUserId } },
          },
        },
      })

      if (!member)
        throw new TRPCError({
          code: 'FORBIDDEN',
          message:
            'Cannot delete this team member (not found, already deleted, or insufficient permissions)',
        })

      if (member.teamMemberRole === TeamMemberRole.ADMIN) {
        const activeAdminCount = await ctx.db.teamMember.count({
          where: {
            teamId: member.teamId,
            teamMemberRole: TeamMemberRole.ADMIN,
            deletedAt: null,
          },
        })

        if (activeAdminCount <= 1) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message:
              'Cannot delete the last admin member of the team. Assign another member as admin first.',
          })
        }
      }

      const deleted = await ctx.db.teamMember.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          deletedById: currentUserId,
        },
      })

      return deleted
    }),
  restore: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const currentUserId = ctx.session.user.id

      const member = await ctx.db.teamMember.findFirst({
        where: {
          id: input.id,
          deletedAt: { not: null },
          team: {
            deletedAt: null,
            adminUsers: { some: { id: currentUserId } },
          },
        },
      })

      if (!member)
        throw new TRPCError({
          code: 'FORBIDDEN',
          message:
            'Cannot restore this team member (not found, not deleted, or insufficient permissions)',
        })

      const restored = await ctx.db.teamMember.update({
        where: { id: input.id },
        data: {
          deletedAt: null,
          deletedById: null,
        },
      })

      return restored
    }),
} satisfies TRPCRouterRecord
