import { PayGradeShiftTypeSchema } from '@fuku/domain/schemas'

export const PayGradeShiftTypeOutputSchema = PayGradeShiftTypeSchema.omit({
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  deletedById: true,
})
