import { createPayGrade, createShiftType, createTeam, createUser } from '@fuku/db/testing/factories'
import { describe, expect, it } from 'vitest'

import { createCaller } from '../helpers/caller'
import { createSessionContext } from '../helpers/context'

describe('shift type', () => {
  describe('byId', () => {
    it('returns a shift type with eligible pay grades', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const shiftType = await createShiftType(team.id)
      const payGrade = await createPayGrade(team.id)
      const caller = createCaller({
        session: createSessionContext(user),
      })
      await caller.shiftType.update({
        id: shiftType.id,
        connectPayGrades: [payGrade.id],
      })
      await expect(
        caller.shiftType.byId({
          id: shiftType.id,
        }),
      ).resolves.toMatchObject({
        id: shiftType.id,
        eligiblePayGrades: [
          expect.objectContaining({
            payGradeId: payGrade.id,
          }),
        ],
      })
    })

    it('returns null for a deleted shift type', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const shiftType = await createShiftType(team.id)
      const caller = createCaller({
        session: createSessionContext(user),
      })
      await caller.shiftType.delete({
        id: shiftType.id,
      })
      await expect(
        caller.shiftType.byId({
          id: shiftType.id,
        }),
      ).resolves.toBeNull()
    })
  })

  describe('listIds', () => {
    it('returns active shift type ids ordered by ascending create date', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const shiftTypeA = await createShiftType(team.id)
      const shiftTypeB = await createShiftType(team.id)
      const shiftTypeC = await createShiftType(team.id)
      const caller = createCaller({
        session: createSessionContext(user),
      })
      await expect(
        caller.shiftType.listIds({
          teamId: team.id,
        }),
      ).resolves.toStrictEqual([
        { id: shiftTypeA.id },
        { id: shiftTypeB.id },
        { id: shiftTypeC.id },
      ])
    })

    it('excludes deleted shift types by default', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const shiftType = await createShiftType(team.id)
      const caller = createCaller({
        session: createSessionContext(user),
      })
      await caller.shiftType.delete({
        id: shiftType.id,
      })
      await expect(
        caller.shiftType.listIds({
          teamId: team.id,
        }),
      ).resolves.not.toContainEqual({
        id: shiftType.id,
      })
    })

    it('includes deleted shift types when requested', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const shiftType = await createShiftType(team.id)
      const caller = createCaller({
        session: createSessionContext(user),
      })
      await caller.shiftType.delete({
        id: shiftType.id,
      })
      await expect(
        caller.shiftType.listIds({
          teamId: team.id,
          includeDeleted: true,
        }),
      ).resolves.toContainEqual({
        id: shiftType.id,
      })
    })

    it('returns correct shift type ids given a limit', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const caller = createCaller({
        session: createSessionContext(user),
      })
      const limit = 2

      await createShiftType(team.id)
      await createShiftType(team.id)
      await createShiftType(team.id)
      const shiftTypeIds = await caller.shiftType.listIds({
        teamId: team.id,
        limit,
      })
      expect(shiftTypeIds).toHaveLength(limit)
    })
  })

  describe('list', () => {
    it('returns active shift types with eligible pay grades', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const shiftType = await createShiftType(team.id)
      const payGrade = await createPayGrade(team.id)
      const caller = createCaller({
        session: createSessionContext(user),
      })
      await caller.shiftType.update({
        id: shiftType.id,
        connectPayGrades: [payGrade.id],
      })
      await expect(
        caller.shiftType.list({
          teamId: team.id,
        }),
      ).resolves.toContainEqual(
        expect.objectContaining({
          id: shiftType.id,
          eligiblePayGrades: [
            expect.objectContaining({
              payGradeId: payGrade.id,
            }),
          ],
        }),
      )
    })

    it('excludes deleted shift types by default', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const shiftType = await createShiftType(team.id)
      const caller = createCaller({
        session: createSessionContext(user),
      })
      await caller.shiftType.delete({
        id: shiftType.id,
      })
      await expect(
        caller.shiftType.list({
          teamId: team.id,
        }),
      ).resolves.not.toContainEqual(
        expect.objectContaining({
          id: shiftType.id,
        }),
      )
    })

    it('includes deleted shift types when requested', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const shiftType = await createShiftType(team.id)
      const caller = createCaller({
        session: createSessionContext(user),
      })
      await caller.shiftType.delete({
        id: shiftType.id,
      })
      await expect(
        caller.shiftType.list({
          teamId: team.id,
          includeDeleted: true,
        }),
      ).resolves.toContainEqual(
        expect.objectContaining({
          id: shiftType.id,
        }),
      )
    })

    it('returns correct shift types given a limit', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const caller = createCaller({
        session: createSessionContext(user),
      })
      const shiftTypeA = await createShiftType(team.id)
      await createShiftType(team.id)
      await createShiftType(team.id)
      const limit = 2

      const shiftTypes = await caller.shiftType.list({
        teamId: team.id,
        limit,
      })
      expect(shiftTypes).toHaveLength(limit)
      expect(shiftTypes).toContainEqual(
        expect.objectContaining({
          id: shiftTypeA.id,
        }),
      )
    })
  })

  describe('create', () => {
    it('creates a shift type with the supplied fields', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const caller = createCaller({
        session: createSessionContext(user),
      })
      await expect(
        caller.shiftType.create({
          teamId: team.id,
          name: 'Morning',
          description: 'Morning shift',
          startTime: '09:00',
          endTime: '17:00',
          color: '#123456',
        }),
      ).resolves.toMatchObject({
        teamId: team.id,
        name: 'Morning',
        description: 'Morning shift',
        startTime: '09:00',
        endTime: '17:00',
        color: '#123456',
        eligiblePayGrades: [],
      })
    })

    it('creates a shift type with eligible pay grades', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const payGradeA = await createPayGrade(team.id)
      const payGradeB = await createPayGrade(team.id)
      const caller = createCaller({
        session: createSessionContext(user),
      })
      await expect(
        caller.shiftType.create({
          teamId: team.id,
          name: 'Morning',
          startTime: '09:00',
          endTime: '17:00',
          connectPayGrades: [payGradeA.id, payGradeB.id],
        }),
      ).resolves.toMatchObject({
        teamId: team.id,
        eligiblePayGrades: expect.arrayContaining([
          expect.objectContaining({
            payGradeId: payGradeA.id,
          }),
          expect.objectContaining({
            payGradeId: payGradeB.id,
          }),
        ]),
      })
    })
  })

  describe('update', () => {
    it('updates the supplied fields', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const shiftType = await createShiftType(team.id)
      const caller = createCaller({
        session: createSessionContext(user),
      })
      await expect(
        caller.shiftType.update({
          id: shiftType.id,
          name: 'Updated',
          description: 'Updated description',
          startTime: '10:00',
          endTime: '18:00',
          color: '#654321',
        }),
      ).resolves.toMatchObject({
        id: shiftType.id,
        name: 'Updated',
        description: 'Updated description',
        startTime: '10:00',
        endTime: '18:00',
        color: '#654321',
      })
    })

    it('updates allowed weekdays', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const shiftType = await createShiftType(team.id)
      const caller = createCaller({
        session: createSessionContext(user),
      })
      await expect(
        caller.shiftType.update({
          id: shiftType.id,
          allowedWeekdays: [1, 2, 3],
        }),
      ).resolves.toMatchObject({
        id: shiftType.id,
        allowedWeekdays: [1, 2, 3],
      })
    })

    it('connects and disconnects eligible pay grades', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const shiftType = await createShiftType(team.id)
      const payGradeA = await createPayGrade(team.id)
      const payGradeB = await createPayGrade(team.id)
      const caller = createCaller({
        session: createSessionContext(user),
      })
      await caller.shiftType.update({
        id: shiftType.id,
        connectPayGrades: [payGradeA.id, payGradeB.id],
      })
      await expect(
        caller.shiftType.update({
          id: shiftType.id,
          connectPayGrades: [payGradeA.id],
          disconnectPayGrades: [payGradeB.id],
        }),
      ).resolves.toMatchObject({
        id: shiftType.id,
        eligiblePayGrades: [
          expect.objectContaining({
            payGradeId: payGradeA.id,
          }),
        ],
      })
    })
  })

  describe('delete', () => {
    it('soft-deletes a shift type', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const shiftType = await createShiftType(team.id)
      const caller = createCaller({
        session: createSessionContext(user),
      })
      await expect(
        caller.shiftType.delete({
          id: shiftType.id,
        }),
      ).resolves.toMatchObject({
        id: shiftType.id,
        deletedAt: expect.any(Date),
        deletedById: user.id,
      })
    })
  })

  describe('restore', () => {
    it('restores a deleted shift type', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const shiftType = await createShiftType(team.id)
      const caller = createCaller({
        session: createSessionContext(user),
      })
      await caller.shiftType.delete({
        id: shiftType.id,
      })
      await expect(
        caller.shiftType.restore({
          id: shiftType.id,
        }),
      ).resolves.toMatchObject({
        id: shiftType.id,
        deletedAt: null,
        deletedById: null,
      })
    })
  })
})
