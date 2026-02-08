import { PayGradeSchema } from '@fuku/db/schemas'
import z from 'zod/v4'

export const PayGradeOutputSchema = PayGradeSchema.extend({
  description: z.string().nullable(),
})

export type PayGradeOutput = z.infer<typeof PayGradeOutputSchema>

export const PayGradeCreateInputSchema = PayGradeSchema.extend({
  teamId: z.string({ error: 'invalid_team_id' }),
  description: z.string().nullish(),
  name: z.string().min(1, { error: 'invalid_pay_grade_name' }),
  baseRate: z
    .number({ error: 'invalid_base_rate' })
    .min(0, { error: 'invalid_base_rate_negative' }),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export const PayGradeUpdateInputSchema = PayGradeSchema.partial().extend({
  id: z.string(),
  name: z.string().min(1, 'invalid_pay_grade_name').optional(),
  baseRate: z.number().min(0, 'invalid_base_rate').optional(),
})

export type PayGradeCreateInput = z.infer<typeof PayGradeCreateInputSchema>
export type PayGradeUpdateInput = z.infer<typeof PayGradeUpdateInputSchema>
