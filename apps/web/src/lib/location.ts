import { LocationSchema } from '@fuku/db/schemas'
import z from 'zod/v4'

export const LocationUISchema = LocationSchema.omit({ team: true }).transform(
  obj => ({
    ...obj,
    address: obj.address ?? null,
    color: obj.color ?? null,
  }),
)

export type LocationUI = z.infer<typeof LocationUISchema>
