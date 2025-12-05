export const SheetId = {
  ADD_LOCATION: 'addLocation',
  ADD_SHIFT_TYPE: 'addShiftType',
  ADD_PAY_GRADE: 'addPayGrade',
} as const

export type SheetId = (typeof SheetId)[keyof typeof SheetId]
