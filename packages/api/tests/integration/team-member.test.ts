import { testDb } from '@fuku/db/testing'
import { createPayGrade, createTeam, createTeamMember, createUser } from '@fuku/db/testing/factories'
import { assert, describe, expect, it } from 'vitest'

import { createCaller } from '../helpers/caller'
import { createSessionContext } from '../helpers/context'

describe('team member', () => {
  describe('countActive', () => {
    it('returns count of active members of active team', async () => {
      const user = await createUser()
      await createTeam(user.id)

      const caller = createCaller({
        session: createSessionContext(user),
      })

      await expect(caller.teamMember.countActive()).resolves.toBe(1)
    })

    it('does not include deleted members', async () => {
      const userA = await createUser()
      const teamA = await createTeam(userA.id)
      const memberB = await createTeamMember(teamA.id)

      const callerA = createCaller({
        session: createSessionContext(userA),
      })

      await callerA.teamMember.delete({
        id: memberB.id,
      })

      await expect(callerA.teamMember.countActive()).resolves.toBe(1)
    })
  })

  describe('byId', () => {
    it('does not let a user read another team\'s member', async () => {
      const userA = await createUser()
      const _teamA = await createTeam(userA.id)
      const callerA = createCaller({
        session: createSessionContext(userA),
      })
      const memberA = (await callerA.user.getMyMemberships())[0]

      const userB = await createUser()
      const callerB = createCaller({
        session: createSessionContext(userB),
      })

      await expect(
        callerB.teamMember.byId({
          id: memberA.id,
        }),
      ).rejects.toThrow()
    })

    it('scopes by authenticated active team', async () => {
      const userA = await createUser()
      const teamA = await createTeam(userA.id)
      const callerA = createCaller({
        session: createSessionContext(userA),
      })
      const memberA = (await callerA.user.getMyMemberships())[0]
      const teamB = await createTeam(userA.id)

      await callerA.user.setLastActiveTeam({
        teamId: teamA.id,
      })

      await expect(
        callerA.teamMember.byId({
          id: memberA.id,
        }),
      ).resolves.toMatchObject({
        id: memberA.id,
      })

      await callerA.user.setLastActiveTeam({
        teamId: teamB.id,
      })

      await expect(
        callerA.teamMember.byId({
          id: memberA.id,
        }),
      ).resolves.toBeNull()
    })

    it('returns null for a deleted member', async () => {
      const userA = await createUser()
      const teamA = await createTeam(userA.id)
      const memberB = await createTeamMember(teamA.id)

      const callerA = createCaller({
        session: createSessionContext(userA),
      })

      await callerA.teamMember.delete({
        id: memberB.id,
      })

      await expect(
        callerA.teamMember.byId({
          id: memberB.id,
        }),
      ).resolves.toBeNull()
    })

    it('returns null for a non-existing member', async () => {
      const userA = await createUser()
      await createTeam(userA.id)

      const callerA = createCaller({
        session: createSessionContext(userA),
      })

      await expect(
        callerA.teamMember.byId({
          id: 'i-dont-exist',
        }),
      ).resolves.toBeNull()
    })
  })

  describe('listIds', () => {
    it('returns { id } for each active member', async () => {
      const userA = await createUser()
      await createTeam(userA.id)

      const callerA = createCaller({
        session: createSessionContext(userA),
      })

      const memberA = (await callerA.user.getMyMemberships())[0]

      assert(memberA.userId === userA.id)

      await expect(
        callerA.teamMember.listIds({}),
      ).resolves.toContainEqual({
        id: memberA.id,
      })
    })

    it('returns ordered by ascending create date', async () => {
      const userA = await createUser()
      const teamA = await createTeam(userA.id)

      const callerA = createCaller({
        session: createSessionContext(userA),
      })

      const memberA = (await callerA.user.getMyMemberships())[0]
      const memberB = await createTeamMember(teamA.id)
      const memberC = await createTeamMember(teamA.id)

      assert(memberA.userId === userA.id)
      assert(
        memberA.createdAt < memberB.createdAt
        && memberB.createdAt < memberC.createdAt,
      )

      await expect(
        callerA.teamMember.listIds({}),
      ).resolves.toStrictEqual([
        { id: memberA.id },
        { id: memberB.id },
        { id: memberC.id },
      ])
    })

    it('returns correct member ids given a limit', async () => {
      const userA = await createUser()
      const teamA = await createTeam(userA.id)

      const callerA = createCaller({
        session: createSessionContext(userA),
      })

      const limit = 3

      for (let i = 0; i < limit; i++) {
        await createTeamMember(teamA.id)
      }

      await expect(
        callerA.teamMember.listIds({ limit }),
      ).resolves.toHaveLength(limit)
    })

    it('excludes deleted members', async () => {
      const userA = await createUser()
      const teamA = await createTeam(userA.id)
      const memberB = await createTeamMember(teamA.id)

      const callerA = createCaller({
        session: createSessionContext(userA),
      })

      await callerA.teamMember.delete({
        id: memberB.id,
      })

      await expect(
        callerA.teamMember.listIds({}),
      ).resolves.not.toContainEqual({
        id: memberB.id,
      })
    })
  })

  describe('list', () => {
    it('returns full active members ordered by pay grade, created date ascending', async () => {
      const userA = await createUser()
      const teamA = await createTeam(userA.id)

      const callerA = createCaller({
        session: createSessionContext(userA),
      })

      const payGradeA = await createPayGrade(teamA.id)
      const memberA = await callerA.teamMember.byId({
        id: (await callerA.user.getMyMemberships())[0].id,
      })
      const memberB = await createTeamMember(teamA.id, {
        payGradeId: payGradeA.id,
      })
      const memberC = await createTeamMember(teamA.id)

      assert(memberA !== null)

      await expect(
        callerA.teamMember.list({}),
      ).resolves.toStrictEqual([
        memberB,
        memberA,
        memberC,
      ])
    })

    it('excludes deleted members', async () => {
      const userA = await createUser()
      const teamA = await createTeam(userA.id)
      const memberB = await createTeamMember(teamA.id)

      const callerA = createCaller({
        session: createSessionContext(userA),
      })

      await callerA.teamMember.delete({
        id: memberB.id,
      })

      await expect(
        callerA.teamMember.list({}),
      ).resolves.not.toContainEqual(
        expect.objectContaining({
          id: memberB.id,
        }),
      )
    })

    it('returns correct members given a limit', async () => {
      const userA = await createUser()
      const teamA = await createTeam(userA.id)

      const callerA = createCaller({
        session: createSessionContext(userA),
      })

      const memberA = await callerA.teamMember.byId({
        id: (await callerA.user.getMyMemberships())[0].id,
      })

      assert(memberA !== null)

      const memberB = await createTeamMember(teamA.id)
      const memberC = await createTeamMember(teamA.id)
      const limit = 2

      const members = await callerA.teamMember.list({ limit })

      expect(members).toHaveLength(limit)
      expect(members).toContainEqual(
        expect.objectContaining({
          id: memberA.id,
        }),
      )
      expect(members).toContainEqual(
        expect.objectContaining({
          id: memberB.id,
        }),
      )
      expect(members).not.toContainEqual(
        expect.objectContaining({
          id: memberC.id,
        }),
      )
    })
  })

  describe('create', () => {
    it('returns a created member not linked to any user by default', async () => {
      const userA = await createUser()
      const teamA = await createTeam(userA.id)

      const callerA = createCaller({
        session: createSessionContext(userA),
      })

      await expect(
        callerA.teamMember.create({
          givenNames: 'Jane',
          familyName: 'Smith',
          teamId: teamA.id,
          teamMemberRole: 'STAFF',
          rateMultiplier: 1,
        }),
      ).resolves.toMatchObject({
        teamId: teamA.id,
        userId: null,
      })
    })

    it('returns a created member linked to a non-member user when username is supplied', async () => {
      const userA = await createUser()
      const teamA = await createTeam(userA.id)

      const callerA = createCaller({
        session: createSessionContext(userA),
      })

      const userB = await createUser()

      await expect(
        callerA.teamMember.create({
          givenNames: userB.name,
          familyName: userB.name,
          teamId: teamA.id,
          teamMemberRole: 'STAFF',
          rateMultiplier: 1,
          username: userB.username,
        }),
      ).resolves.toMatchObject({
        teamId: teamA.id,
        userId: userB.id,
      })

      const callerB = createCaller({
        session: createSessionContext(userB),
      })

      await expect(
        callerB.user.getMyMemberships(),
      ).resolves.toContainEqual(
        expect.objectContaining({
          teamId: teamA.id,
          userId: userB.id,
        }),
      )
    })

    it('uses username over user id when linking a member', async () => {
      const userA = await createUser()
      const teamA = await createTeam(userA.id)

      const callerA = createCaller({
        session: createSessionContext(userA),
      })

      const userB = await createUser()

      await expect(
        callerA.teamMember.create({
          givenNames: userB.name,
          familyName: userB.name,
          teamId: teamA.id,
          teamMemberRole: 'STAFF',
          rateMultiplier: 1,
          username: userB.username,
          userId: 'mismatched-id',
        }),
      ).resolves.toMatchObject({
        userId: userB.id,
      })
    })

    it('does not set last active team for linked users that are not session user', async () => {
      const userA = await createUser()

      const callerA = createCaller({
        session: createSessionContext(userA),
      })

      const teamA = await createTeam(userA.id)

      const userB = await createUser()

      const callerB = createCaller({
        session: createSessionContext(userB),
      })

      const memberB = await callerA.teamMember.create({
        givenNames: userB.name,
        familyName: userB.name,
        teamId: teamA.id,
        teamMemberRole: 'ADMIN',
        rateMultiplier: 1,
        username: userB.username,
      })

      expect(memberB).toMatchObject({
        userId: userB.id,
      })

      await expect(
        callerB.user.getLastActiveTeam(),
      ).resolves.not.toBe(teamA.id)
    })

    it('creates admin member with a linked user', async () => {

    })

    it('rejects creating admin member without a linked user', async () => {

    })

    it('throws when creating a member for a non-existent user', async () => {
      const userA = await createUser()
      const teamA = await createTeam(userA.id)

      const callerA = createCaller({
        session: createSessionContext(userA),
      })

      await expect(
        callerA.teamMember.create({
          givenNames: 'Jane',
          familyName: 'Smith',
          teamId: teamA.id,
          teamMemberRole: 'STAFF',
          rateMultiplier: 1,
          username: 'i-dont-exist',
        }),
      ).rejects.toThrow()
    })

    it('throws when called by non-admin active member', async () => {
      const userA = await createUser()
      const teamA = await createTeam(userA.id)

      const callerA = createCaller({
        session: createSessionContext(userA),
      })

      const userB = await createUser()

      const callerB = createCaller({
        session: createSessionContext(userB),
      })

      await expect(
        callerA.teamMember.create({
          givenNames: userB.name,
          familyName: userB.name,
          teamId: teamA.id,
          teamMemberRole: 'STAFF',
          rateMultiplier: 1,
          username: userB.username,
        }),
      ).resolves.toMatchObject({
        teamMemberRole: 'STAFF',
        teamId: teamA.id,
        userId: userB.id,
      })

      await callerB.user.setLastActiveTeam({
        teamId: teamA.id,
      })

      await expect(
        callerB.teamMember.create({
          givenNames: 'Jane',
          familyName: 'Smith',
          teamId: teamA.id,
          teamMemberRole: 'STAFF',
          rateMultiplier: 1,
        }),
      ).rejects.toThrow()
    })

    it('throws when called by non-member', async () => {
      const userA = await createUser()
      const teamA = await createTeam(userA.id)

      const userB = await createUser()
      const callerB = createCaller({
        session: createSessionContext(userB),
      })

      await expect(
        callerB.teamMember.create({
          givenNames: userB.name,
          familyName: userB.name,
          teamId: teamA.id,
          teamMemberRole: 'STAFF',
          rateMultiplier: 1,
        }),
      ).rejects.toThrow()
    })

    it('throws when creating a member for a user that is already a member of the active team', async () => {
      const userA = await createUser()
      const teamA = await createTeam(userA.id)

      const callerA = createCaller({
        session: createSessionContext(userA),
      })

      await expect(
        callerA.teamMember.create({
          givenNames: 'Jane',
          familyName: 'Smith',
          teamId: teamA.id,
          teamMemberRole: 'STAFF',
          rateMultiplier: 1,
          username: userA.username,
        }),
      ).rejects.toThrow()
    })
  })

  describe('update', () => {
    it('returns a member linked to existing non-member user by username', async () => {
      const userA = await createUser()
      const callerA = createCaller({
        session: createSessionContext(userA),
      })

      const teamA = await createTeam(userA.id)
      const memberA = await createTeamMember(teamA.id)

      const userB = await createUser()
      const callerB = createCaller({
        session: createSessionContext(userB),
      })

      await expect(
        callerB.user.getMyMemberships(),
      ).resolves.toHaveLength(0)

      await expect(
        callerA.teamMember.update({
          id: memberA.id,
          username: userB.username,
        }),
      ).resolves.toMatchObject({
        teamId: teamA.id,
        userId: userB.id,
      })
    })

    it('returns a member update with no linked user and removes user membership', async () => {
      const userA = await createUser()

      const callerA = createCaller({
        session: createSessionContext(userA),
      })

      const teamA = await createTeam(userA.id)

      const userB = await createUser()

      const callerB = createCaller({
        session: createSessionContext(userB),
      })

      const memberB = await callerA.teamMember.create({
        givenNames: userB.name,
        familyName: userB.name,
        teamId: teamA.id,
        teamMemberRole: 'ADMIN',
        rateMultiplier: 1,
        username: userB.username,
      })

      assert(memberB.userId === userB.id)

      await expect(
        callerA.teamMember.update({
          id: memberB.id,
          username: null,
        }),
      ).resolves.toMatchObject({
        userId: null,
        user: null,
      })

      await expect(
        callerB.user.getMyMemberships(),
      ).resolves.toHaveLength(0)
    })

    it('preserves the existing user when username is omitted', async () => {
      const userA = await createUser()

      const callerA = createCaller({
        session: createSessionContext(userA),
      })

      const teamA = await createTeam(userA.id)
      const userB = await createUser()

      const memberB = await callerA.teamMember.create({
        givenNames: userB.name,
        familyName: userB.name,
        teamId: teamA.id,
        teamMemberRole: 'STAFF',
        rateMultiplier: 1,
        username: userB.username,
      })

      await expect(
        callerA.teamMember.update({
          id: memberB.id,
          familyName: 'Updated',
        }),
      ).resolves.toMatchObject({
        id: memberB.id,
        familyName: 'Updated',
        userId: userB.id,
      })
    })

    it('throws when trying to update a non-existing member', async () => {
      const userA = await createUser()
      await createTeam(userA.id)

      const callerA = createCaller({
        session: createSessionContext(userA),
      })

      await expect(
        callerA.teamMember.update({
          id: 'i-dont-exist',
          familyName: 'Jane',
        }),
      ).rejects.toThrow()
    })

    it('throws when trying to update a non-member', async () => {
      const userA = await createUser()
      await createTeam(userA.id)

      const callerA = createCaller({
        session: createSessionContext(userA),
      })

      const userB = await createUser()
      const teamB = await createTeam(userB.id)
      const memberB = await createTeamMember(teamB.id)

      await expect(
        callerA.teamMember.update({
          id: memberB.id,
          familyName: 'Jane',
        }),
      ).rejects.toThrow()
    })

    it('throws when trying to link a member to a non-existing user', async () => {
      const userA = await createUser()
      const teamA = await createTeam(userA.id)
      const memberA = await createTeamMember(teamA.id)

      const callerA = createCaller({
        session: createSessionContext(userA),
      })

      await expect(
        callerA.teamMember.update({
          id: memberA.id,
          username: 'i-dont-exist',
        }),
      ).rejects.toThrow()
    })

    it('throws when trying to link a member to an already active member user', async () => {
      const userA = await createUser()
      const teamA = await createTeam(userA.id)

      const userB = await createUser()
      const memberB = await createTeamMember(teamA.id, {
        userId: userB.id,
      })

      const callerA = createCaller({
        session: createSessionContext(userA),
      })

      await expect(
        callerA.teamMember.update({
          id: memberB.id,
          username: userA.username,
        }),
      ).rejects.toThrow()
    })

    it('throws when attempting to demote the last admin member', async () => {
      const userA = await createUser()

      const callerA = createCaller({
        session: createSessionContext(userA),
      })

      await createTeam(userA.id)

      const memberA = (await callerA.user.getMyMemberships())[0]

      await expect(
        callerA.teamMember.update({
          id: memberA.id,
          teamMemberRole: 'STAFF',
        }),
      ).rejects.toThrow()
    })
  })

  describe('delete', () => {
    it('returns member that has been soft-deleted by admin', async () => {
      const userA = await createUser()
      const teamA = await createTeam(userA.id)

      const callerA = createCaller({
        session: createSessionContext(userA),
      })

      const userB = await createUser()

      const adminMember = await callerA.teamMember.create({
        givenNames: 'Jane',
        familyName: 'Smith',
        teamId: teamA.id,
        teamMemberRole: 'ADMIN',
        rateMultiplier: 1,
        username: userB.username,
      })

      const staffMember = await callerA.teamMember.create({
        givenNames: 'Jane',
        familyName: 'Smith',
        teamId: teamA.id,
        teamMemberRole: 'STAFF',
        rateMultiplier: 1,
      })

      await expect(
        callerA.teamMember.delete({
          id: adminMember.id,
        }),
      ).resolves.toMatchObject({
        id: adminMember.id,
        deletedAt: expect.any(Date),
        deletedById: userA.id,
      })

      await expect(
        callerA.teamMember.delete({
          id: staffMember.id,
        }),
      ).resolves.toMatchObject({
        id: staffMember.id,
        deletedAt: expect.any(Date),
        deletedById: userA.id,
      })
    })

    it('removes membership of linked user of soft-deleted member', async () => {
      const userA = await createUser()
      const teamA = await createTeam(userA.id)

      const callerA = createCaller({
        session: createSessionContext(userA),
      })

      const userB = await createUser()

      const callerB = createCaller({
        session: createSessionContext(userB),
      })

      const memberB = await callerA.teamMember.create({
        givenNames: userB.name,
        familyName: userB.name,
        teamId: teamA.id,
        teamMemberRole: 'ADMIN',
        rateMultiplier: 1,
        username: userB.username,
      })

      await callerA.teamMember.delete({
        id: memberB.id,
      })

      await expect(
        callerB.user.getMyMemberships(),
      ).resolves.toHaveLength(0)
    })

    it('throws when attempting to delete self', async () => {
      const userA = await createUser()
      await createTeam(userA.id)

      const callerA = createCaller({
        session: createSessionContext(userA),
      })

      const memberA = (await callerA.user.getMyMemberships())[0]

      await expect(
        callerA.teamMember.delete({
          id: memberA.id,
        }),
      ).rejects.toThrow()
    })

    it('throws when attempting to delete non-member', async () => {
      const userA = await createUser()

      const callerA = createCaller({
        session: createSessionContext(userA),
      })

      const userB = await createUser()
      const teamB = await createTeam(userB.id)

      const memberB = await testDb.teamMember.findFirst({
        where: {
          userId: userB.id,
          teamId: teamB.id,
        },
      })

      await expect(
        callerA.teamMember.delete({
          id: memberB!.id,
        }),
      ).rejects.toThrow()
    })

    it('throws when attempting to delete last admin member', async () => {
      const userA = await createUser()
      await createTeam(userA.id)

      const callerA = createCaller({
        session: createSessionContext(userA),
      })

      const memberA = (await callerA.user.getMyMemberships())[0]

      await expect(
        callerA.teamMember.delete({
          id: memberA.id,
        }),
      ).rejects.toThrow()
    })
  })

  describe('restore', () => {
    it('returns active member linked to any/no user that was previously soft-deleted', async () => {
      const userA = await createUser()
      const teamA = await createTeam(userA.id)

      const callerA = createCaller({
        session: createSessionContext(userA),
      })

      const userB = await createUser()

      const callerB = createCaller({
        session: createSessionContext(userB),
      })

      const memberB = await callerA.teamMember.create({
        givenNames: userB.name,
        familyName: userB.name,
        teamId: teamA.id,
        teamMemberRole: 'STAFF',
        rateMultiplier: 1,
        username: userB.username,
      })

      const deletedMemberB = await callerA.teamMember.delete({
        id: memberB.id,
      })

      expect(deletedMemberB).toMatchObject({
        id: memberB.id,
        deletedAt: expect.any(Date),
        deletedById: userA.id,
      })

      expect(deletedMemberB).not.toHaveProperty('user')

      await expect(
        callerB.user.getMyMemberships(),
      ).resolves.toHaveLength(0)

      await expect(
        callerA.teamMember.restore({
          id: memberB.id,
        }),
      ).resolves.toMatchObject({
        id: memberB.id,
        deletedAt: null,
        deletedById: null,
        user: expect.objectContaining({
          id: userB.id,
        }),
      })

      await expect(
        callerB.user.getMyMemberships(),
      ).resolves.toHaveLength(1)
    })

    it('throws when attempting to restore non-existent member', async () => {
      const userA = await createUser()
      await createTeam(userA.id)

      const callerA = createCaller({
        session: createSessionContext(userA),
      })

      await expect(
        callerA.teamMember.restore({
          id: 'i-dont-exist',
        }),
      ).rejects.toThrow()
    })

    it('throws when attempting to restore non-deleted member', async () => {
      const userA = await createUser()
      const teamA = await createTeam(userA.id)
      const memberA = await createTeamMember(teamA.id)

      const callerA = createCaller({
        session: createSessionContext(userA),
      })

      await expect(
        callerA.teamMember.restore({
          id: memberA.id,
        }),
      ).rejects.toThrow()
    })
  })

  describe('leave', () => {
    it('returns soft-deleted member linked to session user', async () => {
      const userA = await createUser()

      const callerA = createCaller({
        session: createSessionContext(userA),
      })

      const teamA = await createTeam(userA.id)

      const userB = await createUser()

      const callerB = createCaller({
        session: createSessionContext(userB),
      })

      const memberB = await callerA.teamMember.create({
        givenNames: userB.name,
        familyName: userB.name,
        teamId: teamA.id,
        teamMemberRole: 'STAFF',
        rateMultiplier: 1,
        username: userB.username,
      })

      await callerB.user.setLastActiveTeam({
        teamId: teamA.id,
      })

      await expect(
        callerB.teamMember.leave(),
      ).resolves.toMatchObject({
        id: memberB.id,
        userId: userB.id,
        deletedAt: expect.any(Date),
        deletedById: userB.id,
      })
    })

    it('throws when session user is not a member of active team', async () => {
      const userA = await createUser()
      await createTeam(userA.id)

      const userB = await createUser()

      const callerB = createCaller({
        session: createSessionContext(userB),
      })

      await expect(
        callerB.teamMember.leave(),
      ).rejects.toThrow()
    })

    it('throws when attempting to leave as last admin member', async () => {
      const userA = await createUser()

      const callerA = createCaller({
        session: createSessionContext(userA),
      })

      await createTeam(userA.id)

      await expect(
        callerA.teamMember.leave(),
      ).rejects.toThrow()
    })
  })
})
