import { PayGradeSchema } from '@fuku/db/schemas'
import z from 'zod/v4'

export const PayGradeOutputSchema = PayGradeSchema.extend({
  description: z.string().nullable(),
})

export type PayGradeOutput = z.infer<typeof PayGradeOutputSchema>

export const PayGradeCreateInputSchema = PayGradeSchema.pick({
  id: true,
  name: true,
  baseRate: true,
}).extend({
  name: z.string().min(1, 'invalid_pay_grade_name'),
  baseRate: z.number().min(0, 'invalid_base_rate'),
})

export const PayGradeUpdateInputSchema = PayGradeSchema.partial().extend({
  id: z.string(),
  name: z.string().min(1, 'invalid_pay_grade_name').optional(),
  baseRate: z.number().min(0, 'invalid_base_rate').optional(),
})
