import * as z from 'zod/v4'

export const WorkHourSchema = z.object({
  id: z.string(),
  shiftAssignmentId: z.string(),
  actualStart: z.date(),
  actualEnd: z.date(),
  rateMultiplier: z.number(),
  breakMinutes: z.number(),
  calculatedHours: z.number().optional(),
})

export type WorkHour = z.infer<typeof WorkHourSchema>
