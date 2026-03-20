import { parseCellKey } from '~/lib/schedule'
import { useScheduleStore } from '~/store/schedule.store'

export const useScheduleActions = () => {
  const {
    updateAssignment,
    moveAssignment,
    createAssignment,
    deleteAssignment,
    createUnavailability,
    deleteUnavailability,
  } = useScheduleStore()

  // ASSIGNMENTS
  const updateAssignmentShiftType = ({
    assignmentId,
    shiftTypeId,
  }: {
    assignmentId: string
    shiftTypeId: string
  }) => {
    updateAssignment({ assignmentId, updatedFields: { shiftTypeId } })
  }

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

  const createAssignmentInCell = ({
    cellKey,
    shiftTypeId,
  }: {
    cellKey: string
    shiftTypeId: string
  }) => {
    const { teamMemberId, date } = parseCellKey(cellKey)

    console.log('Creating assignment for', { teamMemberId, date, shiftTypeId })

    createAssignment({
      teamMemberId,
      date,
      shiftTypeId,
    })
  }

  const deleteAssignmentById = (assignmentId: string) => {
    deleteAssignment(assignmentId)
  }

  // UNAVAILABILITIES
  const addUnavailabilityToCell = (cellKey: string) => {
    const { teamMemberId, date } = parseCellKey(cellKey)

    console.log('Adding unavailability for', { teamMemberId, date })

    createUnavailability({
      teamMemberId,
      date,
    })
  }

  const removeUnavailabilityById = (unavailabilityId: string) => {
    deleteUnavailability(unavailabilityId)
  }

  return {
    updateAssignmentShiftType,
    moveAssignmentToCell,
    createAssignmentInCell,
    deleteAssignmentById,
    addUnavailabilityToCell,
    removeUnavailabilityById,
  }
}
