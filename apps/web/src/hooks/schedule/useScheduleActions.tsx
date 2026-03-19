import { parseCellKey } from '~/lib/schedule'
import { useScheduleStore } from '~/store/schedule.store'

export const useScheduleActions = () => {
  const { moveAssignment, createAssignment, deleteAssignment } =
    useScheduleStore()

  // MOVE
  const moveAssignmentToCell = ({
    assignmentId,
    toCellKey,
  }: {
    assignmentId: string
    toCellKey: string
  }) => {
    const { teamMemberId, date } = parseCellKey(toCellKey)

    moveAssignment({
      assignmentId,
      toTeamMemberId: teamMemberId,
      toDate: date,
    })
  }

  // CREATE (click cell)
  const createAssignmentInCell = ({
    cellKey,
    shiftTypeId,
  }: {
    cellKey: string
    shiftTypeId: string
  }) => {
    const { teamMemberId, date } = parseCellKey(cellKey)

    createAssignment({
      teamMemberId,
      date,
      shiftTypeId,
    })
  }

  // DELETE (card action)
  const deleteAssignmentById = (assignmentId: string) => {
    deleteAssignment(assignmentId)
  }

  return {
    moveAssignmentToCell,
    createAssignmentInCell,
    deleteAssignmentById,
  }
}
