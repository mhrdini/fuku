import z from 'zod/v4'

export const PayGradeShiftTypeSchema = z.object({
  payGradeId: z.string(),
  shiftTypeId: z.string(),

  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
  deletedById: z.string().nullable(),
})

export type PayGradeShiftType = z.infer<typeof PayGradeShiftTypeSchema>
