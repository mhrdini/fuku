import z from 'zod/v4'

import { protectedProcedure } from '../../trpc'

export const payGradeRouter = {
  getAllByTeamId: protectedProcedure
    .input(z.object({ teamId: z.string() }))
    .query(async ({ input, ctx }) => {
      const payGrades = await ctx.db.payGrade.findMany({
        where: { teamId: input.teamId },
      })
      return payGrades
    }),
  getAllByTeamSlug: protectedProcedure
    .input(z.object({ teamSlug: z.string() }))
    .query(async ({ input, ctx }) => {
      const payGrades = await ctx.db.payGrade.findMany({
        where: {
          team: {
            slug: input.teamSlug,
          },
        },
      })
      return payGrades
    }),
}
