import z from 'zod/v4'

import { ColorHex } from './helpers'

export const LocationSchema = z.object({
  id: z.string(),
  name: z.string().min(1, { error: 'invalid_location_name' }),
  address: z.string().nullable(),
  teamId: z.string(),
  color: ColorHex.optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
  deletedById: z.string().nullable(),
})

export type Location = z.infer<typeof LocationSchema>
