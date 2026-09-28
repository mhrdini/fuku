import { testDb } from '@fuku/db/testing'
import {
  createDayAssignment,
  createLeaveAssignment,
  createShiftAssignment,
  createShiftType,
  createTeam,
  createTeamMember,
  createUser,
} from '@fuku/db/testing/factories'
import { describe, expect, it } from 'vitest'

import { createCaller } from '../helpers/caller'
import { createSessionContext } from '../helpers/context'

describe('day assignment', () => {
  describe('list', () => {
    it('returns assignments for team members within the date range', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const teamMember = await createTeamMember(team.id)

      const date = new Date('2026-01-15T00:00:00.000Z')
      const assignment = await createDayAssignment(teamMember.id, { date })

      const caller = createCaller({
        session: createSessionContext(user),
      })

      await expect(
        caller.dayAssignment.list({
          teamId: team.id,
          start: new Date('2026-01-01T00:00:00.000Z'),
          end: new Date('2026-01-31T23:59:59.999Z'),
        }),
      ).resolves.toEqual([
        expect.objectContaining({
          id: assignment.id,
          teamMemberId: teamMember.id,
          date,
          shiftAssignment: null,
          leaveAssignment: null,
        }),
      ])
    })

    it('excludes assignments outside the date range', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const teamMember = await createTeamMember(team.id)

      const assignment = await createDayAssignment(teamMember.id, {
        date: new Date('2026-02-01T00:00:00.000Z'),
      })

      const caller = createCaller({
        session: createSessionContext(user),
      })

      const result = await caller.dayAssignment.list({
        teamId: team.id,
        start: new Date('2026-01-01T00:00:00.000Z'),
        end: new Date('2026-01-31T23:59:59.999Z'),
      })

      expect(result).not.toContainEqual(
        expect.objectContaining({ id: assignment.id }),
      )
    })

    it('excludes assignments for deleted team members', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const teamMember = await createTeamMember(team.id)
      const assignment = await createDayAssignment(teamMember.id, {
        date: new Date('2026-01-15T00:00:00.000Z'),
      })

      await testDb.teamMember.update({
        where: { id: teamMember.id },
        data: { deletedAt: new Date() },
      })

      const caller = createCaller({
        session: createSessionContext(user),
      })

      const result = await caller.dayAssignment.list({
        teamId: team.id,
        start: new Date('2026-01-01T00:00:00.000Z'),
        end: new Date('2026-01-31T23:59:59.999Z'),
      })

      expect(result).not.toContainEqual(
        expect.objectContaining({ id: assignment.id }),
      )
    })

    it('includes shift and leave assignments', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const teamMember = await createTeamMember(team.id)
      const shiftType = await createShiftType(team.id)

      const dayAssignment = await createDayAssignment(teamMember.id, {
        date: new Date('2026-01-15T00:00:00.000Z'),
      })

      const shiftAssignment = await createShiftAssignment(
        dayAssignment.id,
        shiftType.id,
      )

      const leaveAssignment = await createLeaveAssignment(dayAssignment.id)

      const caller = createCaller({
        session: createSessionContext(user),
      })

      const result = await caller.dayAssignment.list({
        teamId: team.id,
        start: new Date('2026-01-01T00:00:00.000Z'),
        end: new Date('2026-01-31T23:59:59.999Z'),
      })

      expect(result).toEqual([
        expect.objectContaining({
          id: dayAssignment.id,
          shiftAssignment: expect.objectContaining({
            id: shiftAssignment.id,
          }),
          leaveAssignment: expect.objectContaining({
            id: leaveAssignment.id,
          }),
        }),
      ])
    })

    it('throws when the team does not exist', async () => {
      const user = await createUser()

      const caller = createCaller({
        session: createSessionContext(user),
      })

      await expect(
        caller.dayAssignment.list({
          teamId: 'non-existent-team',
          start: new Date('2026-01-01T00:00:00.000Z'),
          end: new Date('2026-01-31T23:59:59.999Z'),
        }),
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
      })
    })

    it('throws when the team is deleted', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)

      await testDb.team.update({
        where: { id: team.id },
        data: { deletedAt: new Date() },
      })

      const caller = createCaller({
        session: createSessionContext(user),
      })

      await expect(
        caller.dayAssignment.list({
          teamId: team.id,
          start: new Date('2026-01-01T00:00:00.000Z'),
          end: new Date('2026-01-31T23:59:59.999Z'),
        }),
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
      })
    })
  })
})
