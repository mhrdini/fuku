import z from 'zod/v4'

import { protectedProcedure } from '../../trpc'

export const payGradeRouter = {
  getAllByTeam: protectedProcedure
    .input(
      z.object({
        teamId: z.string(),
        limit: z.number().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const payGrades = await ctx.db.payGrade.findMany({
        where: {
          team: {
            id: input.teamId,
          },
        },
        ...(input.limit && { take: input.limit }),
      })
      return payGrades
    }),
}
