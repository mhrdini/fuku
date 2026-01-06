export const SheetId = {
  CREATE_LOCATION: 'createLocation',
  CREATE_SHIFT_TYPE: 'createShiftType',
  CREATE_PAY_GRADE: 'createPayGrade',
} as const

export type SheetId = (typeof SheetId)[keyof typeof SheetId]
