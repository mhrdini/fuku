export const DialogId = {
  CREATE_TEAM_MEMBER: 'createTeamMember',
  UPDATE_TEAM_MEMBER: 'updateTeamMember',
  REMOVE_TEAM_MEMBER: 'removeTeamMember',
  REMOVE_LOCATION: 'removeLocation',
  REMOVE_SHIFT_TYPE: 'removeShiftType',
} as const

export type DialogId = (typeof DialogId)[keyof typeof DialogId]
