export const DialogId = {
  CREATE_TEAM_MEMBER: 'createTeamMember',
  UPDATE_TEAM_MEMBER: 'updateTeamMember',
  REMOVE_TEAM_MEMBER: 'removeTeamMember',
  CREATE_LOCATION: 'createLocation',
  REMOVE_LOCATION: 'removeLocation',
  REMOVE_SHIFT_TYPE: 'removeShiftType',
  REMOVE_PAY_GRADE: 'removePayGrade',
} as const

export type DialogId = (typeof DialogId)[keyof typeof DialogId]
