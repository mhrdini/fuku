import { WorkHourSchema } from '@fuku/domain/schemas'
import * as z from 'zod/v4'

export const WorkHourOutputSchema = WorkHourSchema.extend({
  calculatedHours: z.number().nullable(),
})

export type WorkHourOutput = z.infer<typeof WorkHourOutputSchema>
