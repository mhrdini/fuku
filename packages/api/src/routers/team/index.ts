import {
  TeamInputSchema,
  TeamUpdateInputObjectZodSchema,
} from '@fuku/db/schemas'
import { TRPCError, TRPCRouterRecord } from '@trpc/server'
import { customAlphabet } from 'nanoid'
import { z } from 'zod/v4'

import { protectedProcedure } from '../../trpc'

const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 8)

export const teamRouter = {
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

  getActive: protectedProcedure.query(({ ctx }) => {
    return ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        lastActiveTeam: {
          select: {
            id: true,
            slug: true,
            name: true,
            description: true,
          },
        },
      },
    })
  }),

  setActive: protectedProcedure
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

  create: protectedProcedure
    .input(TeamInputSchema.pick({ name: true, description: true }))
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

      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { lastActiveTeamId: true },
      })

      if (user?.lastActiveTeamId === input.id) {
        await ctx.db.user.update({
          where: { id: ctx.session.user.id },
          data: { lastActiveTeamId: null },
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
