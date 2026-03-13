import { PayGradeOutputSchema } from '@fuku/api/schemas'
import * as z from 'zod/v4'

export const PayGradeUISchema = PayGradeOutputSchema
export type PayGradeUI = z.infer<typeof PayGradeUISchema>
