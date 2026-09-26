import * as z from 'zod/v4'

export const UnavailabilitySchema = z.object({
  id: z.string(),
  teamMemberId: z.string(),
  date: z.date(),
  reason: z.string().nullish(),
})

export type Unavailability = z.infer<typeof UnavailabilitySchema>
