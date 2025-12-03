export const DialogId = {
  ADD_TEAM_MEMBER: 'addTeamMember',
  EDIT_TEAM_MEMBER: 'editTeamMember',
  REMOVE_TEAM_MEMBER: 'removeTeamMember',
} as const

export type DialogId = (typeof DialogId)[keyof typeof DialogId]
