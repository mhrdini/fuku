import { ColorHex, LocationSchema } from '@fuku/db/schemas'
import z from 'zod/v4'

export const LocationOutputSchema = LocationSchema.extend({
  color: ColorHex,
})

export type LocationOutput = z.infer<typeof LocationOutputSchema>

export const LocationCreateInputSchema = LocationSchema.pick({
  id: true,
  name: true,
  color: true,
}).extend({
  name: z.string().min(1, 'invalid_location_name'),
  color: ColorHex.optional(),
})

export const LocationUpdateInputSchema = LocationSchema.partial().extend({
  id: z.string(),
  name: z.string().min(1, 'invalid_location_name').optional(),
  color: ColorHex.optional(),
})
