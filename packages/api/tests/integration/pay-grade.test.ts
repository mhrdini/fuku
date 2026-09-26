import { testDb } from '@fuku/db/testing'
import { createPayGrade, createShiftType, createTeam, createUser } from '@fuku/db/testing/factories'
import { describe, expect, it } from 'vitest'

import { createCaller } from '../helpers/caller'
import { createSessionContext } from '../helpers/context'

describe('pay grade', () => {
  describe('byId', () => {
    it('returns a pay grade with eligible shift types', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const payGrade = await createPayGrade(team.id)
      const shiftType = await createShiftType(team.id)
      const caller = createCaller({
        session: createSessionContext(user),
      })
      await caller.payGrade.update({
        id: payGrade.id,
        connectShiftTypes: [shiftType.id],
      })
      await expect(
        caller.payGrade.byId({
          id: payGrade.id,
        }),
      ).resolves.toMatchObject({
        id: payGrade.id,
        eligibleShiftTypes: [
          expect.objectContaining({
            payGradeId: payGrade.id,
            shiftTypeId: shiftType.id,
          }),
        ],
      })
    })

    it('returns null for a non-existing pay grade', async () => {
      const user = await createUser()
      await createTeam(user.id)
      const caller = createCaller({
        session: createSessionContext(user),
      })
      await expect(
        caller.payGrade.byId({
          id: 'i-dont-exist',
        }),
      ).resolves.toBeNull()
    })
  })

  describe('listIds', () => {
    it('returns pay grade ids ordered by ascending create date', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const caller = createCaller({
        session: createSessionContext(user),
      })
      const payGradeA = await createPayGrade(team.id)
      const payGradeB = await createPayGrade(team.id)
      const payGradeC = await createPayGrade(team.id)
      await expect(
        caller.payGrade.listIds({
          teamId: team.id,
        }),
      ).resolves.toStrictEqual([
        { id: payGradeA.id },
        { id: payGradeB.id },
        { id: payGradeC.id },
      ])
    })

    it('returns correct pay grade ids given a limit', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const caller = createCaller({
        session: createSessionContext(user),
      })
      const limit = 2
      await createPayGrade(team.id)
      await createPayGrade(team.id)
      const payGradeIds = await caller.payGrade.listIds({
        teamId: team.id,
        limit,
      })
      expect(payGradeIds).toHaveLength(limit)
    })

    it('does not return pay grades from another team', async () => {
      const userA = await createUser()
      const teamA = await createTeam(userA.id)
      const userB = await createUser()
      const teamB = await createTeam(userB.id)
      const payGradeB = await createPayGrade(teamB.id)
      const callerA = createCaller({
        session: createSessionContext(userA),
      })
      await expect(
        callerA.payGrade.listIds({
          teamId: teamA.id,
        }),
      ).resolves.not.toContainEqual({
        id: payGradeB.id,
      })
    })
  })

  describe('list', () => {
    it('returns pay grades with eligible shift types ordered by ascending create date', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const caller = createCaller({
        session: createSessionContext(user),
      })
      const payGradeA = await createPayGrade(team.id)
      const payGradeB = await createPayGrade(team.id)
      const shiftType = await createShiftType(team.id)
      await caller.payGrade.update({
        id: payGradeA.id,
        connectShiftTypes: [shiftType.id],
      })
      await expect(
        caller.payGrade.list({
          teamId: team.id,
        }),
      ).resolves.toStrictEqual([
        expect.objectContaining({
          id: payGradeA.id,
          eligibleShiftTypes: [
            expect.objectContaining({
              payGradeId: payGradeA.id,
              shiftTypeId: shiftType.id,
            }),
          ],
        }),
        expect.objectContaining({
          id: payGradeB.id,
          eligibleShiftTypes: [],
        }),
      ])
    })

    it('returns correct pay grades given a limit', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const caller = createCaller({
        session: createSessionContext(user),
      })
      const payGradeA = await createPayGrade(team.id)
      await createPayGrade(team.id)
      await createPayGrade(team.id)
      const limit = 2
      const payGrades = await caller.payGrade.list({
        teamId: team.id,
        limit,
      })
      expect(payGrades).toHaveLength(limit)
      expect(payGrades).toContainEqual(
        expect.objectContaining({
          id: payGradeA.id,
        }),
      )
    })

    it('does not return pay grades from another team', async () => {
      const userA = await createUser()
      const teamA = await createTeam(userA.id)
      const userB = await createUser()
      const teamB = await createTeam(userB.id)
      const payGradeB = await createPayGrade(teamB.id)
      const callerA = createCaller({
        session: createSessionContext(userA),
      })
      await expect(
        callerA.payGrade.list({
          teamId: teamA.id,
        }),
      ).resolves.not.toContainEqual(
        expect.objectContaining({
          id: payGradeB.id,
        }),
      )
    })
  })

  describe('create', () => {
    it('creates a pay grade with the supplied fields', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const caller = createCaller({
        session: createSessionContext(user),
      })
      await expect(
        caller.payGrade.create({
          teamId: team.id,
          name: 'Manager',
          description: 'Manager pay grade',
          baseRate: 1500,
        }),
      ).resolves.toMatchObject({
        teamId: team.id,
        name: 'Manager',
        description: 'Manager pay grade',
        baseRate: 1500,
        eligibleShiftTypes: [],
      })
    })

    it('creates a pay grade with eligible shift types', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const shiftTypeA = await createShiftType(team.id)
      const shiftTypeB = await createShiftType(team.id)
      const caller = createCaller({
        session: createSessionContext(user),
      })
      await expect(
        caller.payGrade.create({
          teamId: team.id,
          name: 'Manager',
          baseRate: 1500,
          connectShiftTypes: [shiftTypeA.id, shiftTypeB.id],
        }),
      ).resolves.toMatchObject({
        teamId: team.id,
        name: 'Manager',
        eligibleShiftTypes:
          expect.arrayContaining(
            [
              expect.objectContaining({
                shiftTypeId: shiftTypeA.id,
              }),
              expect.objectContaining({
                shiftTypeId: shiftTypeB.id,
              }),
            ],
          ),
      })
    })

    it('creates a pay grade without eligible shift types when none are supplied', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const caller = createCaller({
        session: createSessionContext(user),
      })
      await expect(
        caller.payGrade.create({
          teamId: team.id,
          name: 'Staff',
          baseRate: 1200,
        }),
      ).resolves.toMatchObject({
        teamId: team.id,
        name: 'Staff',
        eligibleShiftTypes: [],
      })
    })
  })

  describe('update', () => {
    it('updates pay grade fields', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const payGrade = await createPayGrade(team.id)
      const caller = createCaller({
        session: createSessionContext(user),
      })
      await expect(
        caller.payGrade.update({
          id: payGrade.id,
          name: 'Updated',
          description: 'Updated description',
          baseRate: 1800,
        }),
      ).resolves.toMatchObject({
        id: payGrade.id,
        name: 'Updated',
        description: 'Updated description',
        baseRate: 1800,
      })
    })

    it('connects and disconnects eligible shift types', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const payGrade = await createPayGrade(team.id)
      const shiftTypeA = await createShiftType(team.id)
      const shiftTypeB = await createShiftType(team.id)
      const caller = createCaller({
        session: createSessionContext(user),
      })
      await caller.payGrade.update({
        id: payGrade.id,
        connectShiftTypes: [shiftTypeA.id, shiftTypeB.id],
      })
      await expect(
        caller.payGrade.update({
          id: payGrade.id,
          connectShiftTypes: [shiftTypeA.id],
          disconnectShiftTypes: [shiftTypeB.id],
        }),
      ).resolves.toMatchObject({
        id: payGrade.id,
        eligibleShiftTypes: [
          expect.objectContaining({
            shiftTypeId: shiftTypeA.id,
          }),
        ],
      })
    })

    it('updates only supplied fields', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const payGrade = await createPayGrade(team.id, {
        name: 'Original',
        description: 'Original description',
        baseRate: 1500,
      })
      const caller = createCaller({
        session: createSessionContext(user),
      })
      await expect(
        caller.payGrade.update({
          id: payGrade.id,
          name: 'Updated',
        }),
      ).resolves.toMatchObject({
        id: payGrade.id,
        name: 'Updated',
        description: 'Original description',
        baseRate: 1500,
      })
    })
  })

  describe('delete', () => {
    it('deletes a pay grade with eligible shift types', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const payGrade = await createPayGrade(team.id)
      const shiftType = await createShiftType(team.id)
      const caller = createCaller({
        session: createSessionContext(user),
      })
      await caller.payGrade.update({
        id: payGrade.id,
        connectShiftTypes: [shiftType.id],
      })
      await expect(
        caller.payGrade.delete({
          teamId: team.id,
          id: payGrade.id,
        }),
      ).resolves.toMatchObject({
        id: payGrade.id,
        teamId: team.id,
        eligibleShiftTypes: [
          expect.objectContaining({
            shiftTypeId: shiftType.id,
          }),
        ],
      })
      await expect(
        testDb.payGrade.findUnique({
          where: {
            id: payGrade.id,
          },
        }),
      ).resolves.toBeNull()
    })

    it('throws when deleting a pay grade from another team', async () => {
      const userA = await createUser()
      await createTeam(userA.id)
      const userB = await createUser()
      const teamB = await createTeam(userB.id)
      const payGradeB = await createPayGrade(teamB.id)
      const callerA = createCaller({
        session: createSessionContext(userA),
      })
      await expect(
        callerA.payGrade.delete({
          teamId: 'wrong-team',
          id: payGradeB.id,
        }),
      ).rejects.toThrow()
    })
  })
})
