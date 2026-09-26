import { testDb } from '@fuku/db/testing'
import { createTeam, createTeamMember, createUser } from '@fuku/db/testing/factories'
import { describe, expect, it } from 'vitest'

import { createCaller } from '../helpers/caller'
import { createSessionContext } from '../helpers/context'

describe('user', () => {
  describe('byId', () => {
    it('returns user by id', async () => {
      const userA = await createUser()
      const caller = createCaller({
        session: createSessionContext(userA),
      })

      const userB = await createUser()

      await expect(caller.user.byId({
        id: userB.id,
      })).resolves.toMatchObject({
        id: userB.id,
      })
    })

    it('throws when user does not exist', async () => {
      const user = await createUser()
      const caller = createCaller({
        session: createSessionContext(user),
      })

      await expect(caller.user.byId({
        id: 'i-dont-exist',
      })).rejects.toThrow()
    })
  })

  describe('byUsername', () => {
    it('returns user by username', async () => {
      const userA = await createUser()
      const caller = createCaller({
        session: createSessionContext(userA),
      })

      const userB = await createUser()

      await expect(caller.user.byUsername({
        username: userB.username,
      })).resolves.toMatchObject({
        username: userB.username,
      })
    })

    it('throws when user does not exist', async () => {
      const user = await createUser()
      const caller = createCaller({
        session: createSessionContext(user),
      })

      await expect(caller.user.byUsername({
        username: 'i-dont-exist',
      })).rejects.toThrow()
    })
  })

  describe('getMyMemberships', () => {
    it('returns active memberships', async () => {
      const userA = await createUser()
      const callerA = createCaller({
        session: createSessionContext(userA),
      })
      const teamA = await createTeam(userA.id)

      const userB = await createUser()
      const teamB = await createTeam(userB.id)
      const _ = await createTeamMember(teamB.id, {
        teamMemberRole: 'STAFF',
        userId: userA.id,
      })

      await expect(callerA.user.getMyMemberships()).resolves.toStrictEqual([
        expect.objectContaining({ teamId: teamA.id, teamMemberRole: 'ADMIN' }),
        expect.objectContaining({ teamId: teamB.id, teamMemberRole: 'STAFF' }),
      ])
    })

    it('excludes deleted teams', async () => {
      const user = await createUser()
      const caller = createCaller({
        session: createSessionContext(user),
      })

      const team = await createTeam(user.id)
      await caller.user.setLastActiveTeam({ teamId: team.id })
      await caller.team.delete()

      await expect(caller.user.getMyMemberships()).resolves.toStrictEqual([])
      await expect(caller.user.getMyMemberships()).resolves.toHaveLength(0)
    })

    it('excludes deleted memberships', async () => {
      const userA = await createUser()
      const callerA = createCaller({
        session: createSessionContext(userA),
      })
      const teamA = await createTeam(userA.id)

      const userB = await createUser()
      const callerB = createCaller({
        session: createSessionContext(userB),
      })
      const teamB = await createTeam(userB.id)
      const memberB = await createTeamMember(teamB.id, {
        teamMemberRole: 'STAFF',
        userId: userA.id,
      })
      await callerB.teamMember.delete({
        id: memberB.id,
      })

      const memberships = await callerA.user.getMyMemberships()
      expect(memberships).toContainEqual(
        expect.objectContaining({ teamId: teamA.id }),
      )
      expect(memberships).not.toContainEqual(
        expect.objectContaining({ teamId: teamB.id }),
      )
    })
  })

  describe('getLastActiveTeam', () => {
    it('returns active team', async () => {
      const user = await createUser()
      const caller = createCaller({
        session: createSessionContext(user),
      })
      const team = await createTeam(user.id)

      await expect(caller.user.getLastActiveTeam()).resolves.toMatchObject({
        id: team.id,
      })
    })

    it('returns null if no last active team', async () => {
      const user = await createUser()
      const caller = createCaller({
        session: createSessionContext(user),
      })
      const team = await createTeam(user.id)

      await testDb.team.delete({
        where: { id: team.id },
      })

      await expect(caller.user.getLastActiveTeam()).resolves.toBeNull()
    })

    it('returns null with no teams', async () => {
      const user = await createUser()
      const caller = createCaller({
        session: createSessionContext(user),
      })

      await expect(caller.user.getLastActiveTeam()).resolves.toBeNull()
    })
  })

  describe('setLastActiveTeam', () => {
    it('sets member team', async () => {
      const user = await createUser()
      const caller = createCaller({
        session: createSessionContext(user),
      })
      const team = await createTeam(user.id)

      await expect(caller.user.setLastActiveTeam({
        teamId: team.id,
      })).resolves.toMatchObject({
        id: team.id,
      })
    })

    it('rejects non-member', async () => {
      const userA = await createUser()
      const team = await createTeam(userA.id)
      const userB = await createUser()
      const callerB = createCaller({
        session: createSessionContext(userB),
      })

      await expect(callerB.user.setLastActiveTeam({
        teamId: team.id,
      })).rejects.toThrow()
    })

    it('rejects deleted team', async () => {
      const user = await createUser()
      const caller = createCaller({
        session: createSessionContext(user),
      })
      const team = await createTeam(user.id)
      await testDb.team.delete({
        where: {
          id: team.id,
        },
      })

      await expect(caller.user.setLastActiveTeam({
        teamId: team.id,
      })).rejects.toThrow()
    })
  })

  describe('getSidebarState', () => {
    it('returns active user teams', async () => {
      const userA = await createUser()
      const callerA = createCaller({
        session: createSessionContext(userA),
      })
      const teamA = await createTeam(userA.id)

      const userB = await createUser()
      const callerB = createCaller({
        session: createSessionContext(userB),
      })
      const teamB = await createTeam(userB.id)
      await callerB.teamMember.create({
        givenNames: userA.name,
        familyName: userA.name,
        teamId: teamB.id,
        teamMemberRole: 'STAFF',
        rateMultiplier: 1,
        username: userA.username,
      })

      await expect(callerA.user.getSidebarState()).resolves.toMatchObject({
        teams: expect.arrayContaining([
          expect.objectContaining({ id: teamA.id }),
          expect.objectContaining({ id: teamB.id }),
        ]),
      })
    })

    it('excludes deleted teams', async () => {
      const userA = await createUser()
      const callerA = createCaller({
        session: createSessionContext(userA),
      })
      const teamA = await createTeam(userA.id)

      const userB = await createUser()
      const callerB = createCaller({
        session: createSessionContext(userB),
      })
      const teamB = await createTeam(userB.id)
      await callerB.teamMember.create({
        givenNames: userA.name,
        familyName: userA.name,
        teamId: teamB.id,
        teamMemberRole: 'STAFF',
        rateMultiplier: 1,
        username: userA.username,
      })

      await testDb.team.delete({
        where: {
          id: teamA.id,
        },
      })

      await expect(callerA.user.getSidebarState()).resolves.toMatchObject({
        teams: expect.arrayContaining([
          expect.objectContaining({ id: teamB.id }),
        ]),
      })
    })

    it('resolves active team', async () => {
      const userA = await createUser()
      const callerA = createCaller({
        session: createSessionContext(userA),
      })
      const teamA = await createTeam(userA.id)

      const userB = await createUser()
      const callerB = createCaller({
        session: createSessionContext(userB),
      })
      const teamB = await createTeam(userB.id)
      await callerB.teamMember.create({
        givenNames: userA.name,
        familyName: userA.name,
        teamId: teamB.id,
        teamMemberRole: 'STAFF',
        rateMultiplier: 1,
        username: userA.username,
      })

      await testDb.team.delete({
        where: {
          id: teamA.id,
        },
      })

      await expect(callerA.user.getSidebarState()).resolves.toMatchObject({
        activeTeam: expect.objectContaining({
          id: teamB.id,
        }),
      })
    })

    it('falls back to first team', async () => {
      const userA = await createUser()
      const callerA = createCaller({
        session: createSessionContext(userA),
      })
      const teamA = await createTeam(userA.id)
      const teamB = await createTeam(userA.id)

      await testDb.team.delete({
        where: {
          id: teamA.id,
        },
      })

      await expect(callerA.user.getSidebarState()).resolves.toMatchObject({
        activeTeam: expect.objectContaining({
          id: teamB.id,
        }),
      })
    })
  })
})
