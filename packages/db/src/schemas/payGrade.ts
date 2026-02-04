import z from 'zod/v4'

export const PayGradeSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullish(),
  baseRate: z.number(),
  teamId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type PayGrade = z.infer<typeof PayGradeSchema>
