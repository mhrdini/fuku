export const SheetId = {
  MANAGE_LOCATIONS: 'manageLocations',
  MANAGE_SHIFT_TYPES: 'manageShiftTypes',
  MANAGE_PAY_GRADES: 'managePayGrades',
} as const

export type SheetId = (typeof SheetId)[keyof typeof SheetId]
