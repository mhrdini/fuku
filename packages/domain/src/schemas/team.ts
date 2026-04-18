import * as z from 'zod/v4'

import { CountrySchema, TimeZoneSchema } from './helpers'

export const TeamSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string().min(1, 'invalid_team_name'),
  description: z.string().nullish(),

  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
  deletedById: z.string().nullable(),

  timeZone: TimeZoneSchema,
  country: CountrySchema.nullish(),
})

export type Team = z.infer<typeof TeamSchema>
