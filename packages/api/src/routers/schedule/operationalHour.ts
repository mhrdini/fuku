import { DayOfWeek } from '@fuku/domain/schemas'
import { TRPCRouterRecord } from '@trpc/server'
import z from 'zod/v4'

import {
  OperationalHourCreateInputSchema,
  OperationalHoursOutput,
  OperationalHoursOutputSchema,
  OperationalHourUpdateInputSchema,
} from '../../schemas'
import { protectedProcedure } from '../../trpc'

export const operationalHourRouter = {
  list: protectedProcedure
    .input(
      z.object({
        teamId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const operationalHours = await ctx.db.operationalHour.findMany({
        where: { teamId: input.teamId },
        select: {
          teamId: true,
          dayOfWeek: true,
          startTime: true,
          endTime: true,
          deletedAt: true,
        },
      })
      const result: OperationalHoursOutput = operationalHours.reduce(
        (acc, oh) => {
          const day = oh.dayOfWeek as DayOfWeek
          acc[day] = {
            teamId: oh.teamId,
            startTime: oh.startTime,
            endTime: oh.endTime,
            deletedAt: oh.deletedAt,
          }
          return acc
        },
        {} as OperationalHoursOutput,
      )
      return result
    }),

  listActive: protectedProcedure
    .input(
      z.object({
        teamId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const operationalHours = await ctx.db.operationalHour.findMany({
        where: {
          teamId: input.teamId,
          deletedAt: null,
        },
        select: {
          teamId: true,
          dayOfWeek: true,
          startTime: true,
          endTime: true,
        },
      })
      const result: OperationalHoursOutput = operationalHours.reduce(
        (acc, oh) => {
          const day = oh.dayOfWeek as DayOfWeek
          acc[day] = {
            teamId: oh.teamId,
            startTime: oh.startTime,
            endTime: oh.endTime,
            deletedAt: null,
          }
          return acc
        },
        {} as OperationalHoursOutput,
      )
      return result
    }),

  create: protectedProcedure
    .input(OperationalHourCreateInputSchema)
    .mutation(async ({ ctx, input }) => {
      const created = await ctx.db.operationalHour.create({
        data: { ...input },
      })
      return created
    }),

  update: protectedProcedure
    .input(OperationalHourUpdateInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { ...data } = input
      const updated = await ctx.db.operationalHour.update({
        where: {
          teamId_dayOfWeek: {
            teamId: input.teamId,
            dayOfWeek: input.dayOfWeek,
          },
        },
        data: { ...data },
      })
      return updated
    }),

  setHours: protectedProcedure
    .input(
      z.object({
        teamId: z.string(),
        operationalHours: OperationalHoursOutputSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      for (const [day, oh] of Object.entries(input.operationalHours)) {
        const dayOfWeek = parseInt(day) as DayOfWeek

        if (!oh) {
          await ctx.db.operationalHour.updateMany({
            where: {
              teamId: input.teamId,
              dayOfWeek,
            },
            data: {
              deletedAt: new Date(),
              deletedById: ctx.session.user.id,
            },
          })
        } else {
          await ctx.db.operationalHour.upsert({
            where: {
              teamId_dayOfWeek: {
                teamId: oh.teamId,
                dayOfWeek: dayOfWeek,
              },
            },
            update: {
              startTime: oh.startTime,
              endTime: oh.endTime,
              deletedAt: oh.deletedAt ? new Date() : null,
              ...(oh.deletedAt
                ? { deletedById: ctx.session.user.id }
                : { deletedById: null }),
            },
            create: {
              teamId: oh.teamId,
              dayOfWeek: dayOfWeek,
              startTime: oh.startTime,
              endTime: oh.endTime,
              deletedAt: oh.deletedAt ? new Date() : null,
              ...(oh.deletedAt
                ? { deletedById: ctx.session.user.id }
                : { deletedById: null }),
            },
          })
        }
      }
    }),
} satisfies TRPCRouterRecord
