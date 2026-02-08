import { ColorHex, LocationSchema } from '@fuku/db/schemas'
import z from 'zod/v4'

export const LocationOutputSchema = LocationSchema.extend({
  color: ColorHex,
})

export type LocationOutput = z.infer<typeof LocationOutputSchema>

export const LocationCreateInputSchema = LocationSchema.extend({
  name: z.string().min(1, 'invalid_location_name'),
  address: z.string().optional(),
  color: ColorHex.optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  deletedById: true,
})

export const LocationUpdateInputSchema = LocationSchema.partial().extend({
  id: z.string(),
  name: z.string().min(1, 'invalid_location_name').optional(),
  color: ColorHex.optional(),
})

export type LocationCreateInput = z.infer<typeof LocationCreateInputSchema>
export type LocationUpdateInput = z.infer<typeof LocationUpdateInputSchema>
