import { UnavailabilitySchema } from '@fuku/domain/schemas'
import * as z from 'zod/v4'

export const UnavailabilityCreateInputSchema = UnavailabilitySchema.omit({
  id: true,
})

export type UnavailabilityCreateInput = z.infer<
  typeof UnavailabilityCreateInputSchema
>

export const UnavailabilityOutputSchema = UnavailabilitySchema

export type UnavailabilityOutput = z.infer<typeof UnavailabilityOutputSchema>
