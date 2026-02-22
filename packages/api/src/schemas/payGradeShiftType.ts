import { PayGradeShiftTypeSchema } from '@fuku/db/schemas'

export const PayGradeShiftTypeOutputSchema = PayGradeShiftTypeSchema.omit({
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  deletedById: true,
})
