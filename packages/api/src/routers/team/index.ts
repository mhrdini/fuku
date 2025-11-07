import {
  TeamCreateInputObjectZodSchema,
  TeamUpdateInputObjectZodSchema,
} from '@fuku/db/schemas'
import { TRPCError, TRPCRouterRecord } from '@trpc/server'
import { customAlphabet } from 'nanoid'
import { z } from 'zod/v4'

import { protectedProcedure } from '../../trpc'

const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 8)

export const teamRouter = {
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      if (!input.id)
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Team ID is required',
        })

      const team = await ctx.db.team.findFirst({
        where: {
          id: input.id,
          deletedAt: null,
          adminUsers: { some: { id: ctx.session.user.id } },
        },
        include: {
          teamMembers: {
            where: { deletedAt: null },
            include: {
              user: { select: { id: true, name: true, username: true } },
              payGrade: { select: { id: true, name: true, baseRate: true } },
            },
          },
          payGrades: { select: { id: true, name: true, baseRate: true } },
        },
      })

      if (!team)
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `No team with id '${input.id}' found or you do not have permission to view it`,
        })

      return team
    }),

  getBySlug: protectedProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input, ctx }) => {
      const team = await ctx.db.team.findFirst({
        where: {
          slug: input.slug,
          deletedAt: null,
          adminUsers: { some: { id: ctx.session.user.id } },
        },
        include: {
          teamMembers: {
            where: { deletedAt: null },
            include: {
              user: { select: { id: true, name: true, username: true } },
              payGrade: { select: { id: true, name: true, baseRate: true } },
            },
          },
          payGrades: { select: { id: true, name: true, baseRate: true } },
        },
      })

      if (!team)
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `No team with slug '${input.slug}' found or you do not have permission to view it`,
        })

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
  getTeamMembersByTeamId: protectedProcedure
    .input(z.object({ teamId: z.string() }))
    .query(async ({ input, ctx }) => {
      const isAdmin = await ctx.db.team.count({
        where: {
          id: input.teamId,
          deletedAt: null,
          adminUsers: { some: { id: ctx.session.user.id } },
        },
      })

      if (!isAdmin) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `You do not have permission to view members of this team`,
        })
      }

      const members = await ctx.db.teamMember.findMany({
        where: { teamId: input.teamId, deletedAt: null },
        include: {
          user: { select: { id: true, name: true, username: true } },
          payGrade: { select: { id: true, name: true, baseRate: true } },
        },
      })

      return members
    }),
  getTeamMembersBySlug: protectedProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input, ctx }) => {
      const isAdmin = await ctx.db.team.count({
        where: {
          slug: input.slug,
          deletedAt: null,
          adminUsers: { some: { id: ctx.session.user.id } },
        },
      })

      if (!isAdmin) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `You do not have permission to view members of this team`,
        })
      }

      const team = await ctx.db.team.findFirst({
        where: { slug: input.slug, deletedAt: null },
      })

      if (!team) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `No team with slug '${input.slug}' found`,
        })
      }

      const members = await ctx.db.teamMember.findMany({
        where: { teamId: team.id, deletedAt: null },
        include: {
          user: { select: { id: true, email: true, username: true } },
          payGrade: { select: { id: true, name: true, baseRate: true } },
        },
      })

      return members
    }),

  create: protectedProcedure
    .input(TeamCreateInputObjectZodSchema.omit({ slug: true }))
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

      const newTeam = await ctx.db.team.create({
        data: {
          slug,
          name: input.name,
          description: input.description,
          adminUsers: { connect: { id: ctx.session.user.id } },
        },
        include: {
          teamMembers: true,
          payGrades: true,
        },
      })
      return newTeam
    }),

  update: protectedProcedure
    .input(TeamUpdateInputObjectZodSchema.extend({ id: z.string() }))
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
      const deletedCount = await ctx.db.team.updateMany({
        where: {
          id: input.id,
          deletedAt: null,
          adminUsers: { some: { id: ctx.session.user.id } },
        },
        data: { deletedAt: new Date(), deletedById: ctx.session.user.id },
      })

      if (deletedCount.count === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `No team with id '${input.id}' found or you do not have permission to delete it`,
        })
      }

      return { id: input.id, deletedAt: new Date() }
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
