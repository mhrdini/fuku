import z from 'zod/v4'

export const PayGradeSchema = z.object({
  id: z.string(),
  name: z.string().min(1, { error: 'invalid_pay_grade_name' }),
  description: z.string().nullish(),
  baseRate: z
    .number({ error: 'invalid_base_rate' })
    .min(0, { error: 'invalid_base_rate_negative' }),
  teamId: z.string({ error: 'invalid_team_id' }),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type PayGrade = z.infer<typeof PayGradeSchema>
