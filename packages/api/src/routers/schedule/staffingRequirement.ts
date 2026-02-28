import { DayOfWeek, DayOfWeekSchema } from '@fuku/domain/schemas'
import { TRPCRouterRecord } from '@trpc/server'
import z from 'zod/v4'

import {
  StaffingRequirementsOutput,
  StaffingRequirementsOutputSchema,
} from '../../schemas/staffingRequirement'
import { protectedProcedure } from '../../trpc'

export const staffingRequirementRouter = {
  list: protectedProcedure
    .input(
      z.object({
        teamId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const staffingRequirements = await ctx.db.staffingRequirement.findMany({
        where: {
          teamId: input.teamId,
        },
        select: {
          teamId: true,
          dayOfWeek: true,
          minMembers: true,
          maxMembers: true,
        },
      })

      const result: StaffingRequirementsOutput = staffingRequirements.reduce(
        (acc, sr) => {
          const day = sr.dayOfWeek as DayOfWeek
          acc[day] = {
            teamId: sr.teamId,
            minMembers: sr.minMembers,
            maxMembers: sr.maxMembers,
          }
          return acc
        },
        {} as StaffingRequirementsOutput,
      )

      return result
    }),

  setStaffing: protectedProcedure
    .input(
      z.object({
        teamId: z.string(),
        staffingRequirements: StaffingRequirementsOutputSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      for (const [day, st] of Object.entries(input.staffingRequirements)) {
        const dayOfWeek = parseInt(day) as DayOfWeek

        if (st) {
          await ctx.db.staffingRequirement.upsert({
            where: {
              teamId_dayOfWeek: {
                teamId: input.teamId,
                dayOfWeek,
              },
            },
            update: {
              ...(st.minMembers ? { minMembers: st.minMembers } : {}),
              ...(st.maxMembers ? { maxMembers: st.maxMembers } : {}),
            },
            create: {
              teamId: input.teamId,
              dayOfWeek,
              ...(st.minMembers ? { minMembers: st.minMembers } : {}),
              ...(st.maxMembers ? { maxMembers: st.maxMembers } : {}),
            },
          })
        }
      }
    }),

  delete: protectedProcedure
    .input(
      z.object({
        teamId: z.string(),
        dayOfWeek: DayOfWeekSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const deleted = await ctx.db.staffingRequirement.delete({
        where: {
          teamId_dayOfWeek: {
            teamId: input.teamId,
            dayOfWeek: input.dayOfWeek,
          },
        },
      })
      return deleted
    }),
} satisfies TRPCRouterRecord
