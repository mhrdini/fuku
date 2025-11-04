import { TeamMemberRole } from '@fuku/db'
import { TRPCError, TRPCRouterRecord } from '@trpc/server'
import z from 'zod/v4'

import { protectedProcedure } from '../../trpc'

const teamMemberSchema = z.object({
  teamId: z.string(),
  familyName: z.string(),
  givenNames: z.string(),
  role: z.enum(TeamMemberRole).optional(),
  payGradeId: z.string().optional(),
  rateMultiplier: z.number().optional(),
  color: z.string().optional(),
  userId: z.string().optional(),
})

export const teamMemberRouter = {
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const member = await ctx.db.teamMember.findUnique({
        where: { id: input.id },
        include: {
          user: { select: { id: true, name: true, username: true } },
          payGrade: true,
        },
      })

      if (!member) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `No team member with id '${input.id}'`,
        })
      }

      return member
    }),
  create: protectedProcedure
    .input(teamMemberSchema)
    .mutation(async ({ input, ctx }) => {
      const newMember = await ctx.db.teamMember.create({
        data: input,
      })

      return newMember
    }),
  update: protectedProcedure
    .input(teamMemberSchema.extend({ id: z.string() }))
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

      if (!member) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message:
            'Cannot edit this team member (not found, deleted, or insufficient permissions)',
        })
      }

      return ctx.db.teamMember.update({
        where: { id },
        data,
      })
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const deletedMember = await ctx.db.teamMember.update({
        where: { id: input.id },
        data: {
          deletedAt: new Date(),
          deletedById: ctx.session.user.id,
        },
      })

      return deletedMember
    }),
  restore: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const restoredMember = await ctx.db.teamMember.update({
        where: { id: input.id },
        data: {
          deletedAt: null,
          deletedById: null,
        },
      })

      return restoredMember
    }),
} satisfies TRPCRouterRecord
