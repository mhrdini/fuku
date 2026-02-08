import { LocationSchema } from '@fuku/db/schemas'
import z from 'zod/v4'

export const LocationUISchema = LocationSchema
export type LocationUI = z.infer<typeof LocationUISchema>
