import { TeamMemberRole } from '@fuku/db'
import { TeamMemberSchema } from '@fuku/db/schemas'
import { TRPCError, TRPCRouterRecord } from '@trpc/server'
import z from 'zod/v4'

import { teamProcedure } from '../../trpc'

export const teamMemberRouter = {
  list: teamProcedure
    .input(
      z.object({
        limit: z.number().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.teamMember.findMany({
        where: {
          teamId: ctx.activeTeamId, // ← source of truth
          deletedAt: null,
        },
        include: {
          user: true,
          payGrade: true,
        },
        ...(input.limit && { take: input.limit }),
        orderBy: [
          { payGrade: { name: 'asc' } },
          { createdAt: 'asc' },
          { givenNames: 'asc' },
          { familyName: 'asc' },
        ],
      })
    }),

  create: teamProcedure
    .input(
      TeamMemberSchema.omit({
        id: true,
        teamId: true,
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

      return ctx.db.teamMember.create({
        data: {
          ...data,
          teamId: ctx.activeTeamId!,
          userId,
        },
      })
    }),

  update: teamProcedure
    .input(
      TeamMemberSchema.partial().extend({
        id: z.string(),
        username: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { id, username, ...data } = input

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

      const updated = await ctx.db.teamMember.update({
        where: {
          id,
        },
        data: {
          ...data,
          ...(userId !== null && { userId }),
        },
      })
      return updated
    }),

  delete: teamProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const member = await ctx.db.teamMember.findFirst({
        where: {
          id: input.id,
          teamId: ctx.activeTeamId!,
          deletedAt: null,
        },
      })

      if (!member) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message:
            'Cannot delete this team member (not found or insufficient permissions)',
        })
      }

      if (member.teamMemberRole === TeamMemberRole.ADMIN) {
        const activeAdminCount = await ctx.db.teamMember.count({
          where: {
            teamId: ctx.activeTeamId!,
            teamMemberRole: TeamMemberRole.ADMIN,
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
        where: { id: input.id },
        data: {
          deletedAt: new Date(),
          deletedById: ctx.session.user.id,
        },
      })
    }),

  restore: teamProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const restored = await ctx.db.teamMember.update({
        where: {
          id: input.id,
        },
        data: {
          deletedAt: null,
          deletedById: null,
        },
      })
      return restored
    }),
} satisfies TRPCRouterRecord
