import z from 'zod/v4'

import { ColorHex, Time } from './helpers'

export const ShiftTypeSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullish(),
  startTime: Time,
  endTime: Time,
  color: ColorHex.optional(),
  teamId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
  deletedById: z.string().nullable(),
})

export type ShiftType = z.infer<typeof ShiftTypeSchema>
