import { PayGradeSchema } from '@fuku/db/schemas'
import z from 'zod/v4'

export const PayGradeUISchema = PayGradeSchema
export type PayGradeUI = z.infer<typeof PayGradeUISchema>
