import { LocationSchema } from '@fuku/domain/schemas'
import z from 'zod/v4'

export const LocationUISchema = LocationSchema
export type LocationUI = z.infer<typeof LocationUISchema>
