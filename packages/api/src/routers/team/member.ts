import {
  TeamMemberCreateOneZodSchema,
  TeamMemberSchema,
  TeamMemberUpdateInputObjectZodSchema,
} from '@fuku/db/schemas'
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

      return TeamMemberSchema.parse(member)
    }),

  create: protectedProcedure
    .input(TeamMemberCreateOneZodSchema.shape.data)
    .mutation(async ({ input, ctx }) => {
      const newMember = await ctx.db.teamMember.create({ data: input })
      return newMember
    }),

  update: protectedProcedure
    .input(TeamMemberUpdateInputObjectZodSchema.extend({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input
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
            'Cannot edit this team member (not found, deleted, or insufficient permissions)',
        })
      const updated = await ctx.db.teamMember.update({ where: { id }, data })
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
