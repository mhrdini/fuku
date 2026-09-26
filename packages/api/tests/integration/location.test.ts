import { testDb } from '@fuku/db/testing'
import { createLocation, createTeam, createUser } from '@fuku/db/testing/factories'
import { describe, expect, it } from 'vitest'

import { createCaller } from '../helpers/caller'
import { createSessionContext } from '../helpers/context'

describe('location', () => {
  describe('byId', () => {
    it('returns a location', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const location = await createLocation(team.id)
      const caller = createCaller({
        session: createSessionContext(user),
      })
      await expect(
        caller.location.byId({
          id: location.id,
        }),
      ).resolves.toMatchObject({
        id: location.id,
        teamId: team.id,
      })
    })

    it('returns null for a non-existing location', async () => {
      const user = await createUser()
      await createTeam(user.id)
      const caller = createCaller({
        session: createSessionContext(user),
      })
      await expect(
        caller.location.byId({
          id: 'i-dont-exist',
        }),
      ).resolves.toBeNull()
    })
  })

  describe('listIds', () => {
    it('returns active location ids ordered by ascending create date', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const locationA = await createLocation(team.id)
      const locationB = await createLocation(team.id)
      const locationC = await createLocation(team.id)
      const caller = createCaller({
        session: createSessionContext(user),
      })
      await expect(
        caller.location.listIds({
          teamId: team.id,
        }),
      ).resolves.toStrictEqual([

        { id: locationA.id },
        { id: locationB.id },
        { id: locationC.id },
      ])
    })

    it('excludes deleted locations', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const location = await createLocation(team.id)
      const caller = createCaller({
        session: createSessionContext(user),
      })
      await caller.location.delete({
        id: location.id,
      })
      await expect(
        caller.location.listIds({
          teamId: team.id,
        }),
      ).resolves.not.toContainEqual({
        id: location.id,
      })
    })

    it('returns correct location ids given a limit', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const caller = createCaller({
        session: createSessionContext(user),
      })
      const limit = 2

      await createLocation(team.id)
      await createLocation(team.id)
      await createLocation(team.id)
      const locationIds = await caller.location.listIds({
        teamId: team.id,
        limit,
      })
      expect(locationIds).toHaveLength(limit)
    })

    it('does not return locations from another team', async () => {
      const userA = await createUser()
      const teamA = await createTeam(userA.id)
      const userB = await createUser()
      const teamB = await createTeam(userB.id)
      const locationB = await createLocation(teamB.id)
      const callerA = createCaller({
        session: createSessionContext(userA),
      })
      await expect(
        callerA.location.listIds({
          teamId: teamA.id,
        }),
      ).resolves.not.toContainEqual({
        id: locationB.id,
      })
    })
  })

  describe('list', () => {
    it('returns active locations', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const locationA = await createLocation(team.id)
      const locationB = await createLocation(team.id)
      const caller = createCaller({
        session: createSessionContext(user),
      })
      await caller.location.delete({
        id: locationB.id,
      })
      await expect(
        caller.location.list({
          teamId: team.id,
        }),
      ).resolves.toStrictEqual([

        locationA,
      ])
    })

    it('returns correct locations given a limit', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const caller = createCaller({
        session: createSessionContext(user),
      })
      const locationA = await createLocation(team.id)
      await createLocation(team.id)
      await createLocation(team.id)
      const limit = 2

      const locations = await caller.location.list({
        teamId: team.id,
        limit,
      })
      expect(locations).toHaveLength(limit)
      expect(locations).toContainEqual(locationA)
    })

    it('does not return locations from another team', async () => {
      const userA = await createUser()
      const teamA = await createTeam(userA.id)
      const userB = await createUser()
      const teamB = await createTeam(userB.id)
      const locationB = await createLocation(teamB.id)
      const callerA = createCaller({
        session: createSessionContext(userA),
      })
      await expect(
        callerA.location.list({
          teamId: teamA.id,
        }),
      ).resolves.not.toContainEqual(
        expect.objectContaining({
          id: locationB.id,
        }),
      )
    })
  })

  describe('create', () => {
    it('creates a location with the supplied fields', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const caller = createCaller({
        session: createSessionContext(user),
      })
      await expect(
        caller.location.create({
          teamId: team.id,
          name: 'Main Cafe',
          address: '1-2-3 Tokyo',
          color: '#123456',
        }),
      ).resolves.toMatchObject({
        teamId: team.id,
        name: 'Main Cafe',
        address: '1-2-3 Tokyo',
        color: '#123456',
      })
    })
  })

  describe('update', () => {
    it('updates the supplied fields', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const location = await createLocation(team.id, {
        name: 'Original',
        address: 'Original address',
      })
      const caller = createCaller({
        session: createSessionContext(user),
      })
      await expect(
        caller.location.update({
          id: location.id,
          name: 'Updated',
          address: 'Updated address',
        }),
      ).resolves.toMatchObject({
        id: location.id,
        name: 'Updated',
        address: 'Updated address',
      })
    })

    it('updates color', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const location = await createLocation(team.id, {
        color: '#123456',
      })
      const caller = createCaller({
        session: createSessionContext(user),
      })
      await expect(
        caller.location.update({
          id: location.id,
          color: '#654321',
        }),
      ).resolves.toMatchObject({
        id: location.id,
        color: '#654321',
      })
    })
  })

  describe('delete', () => {
    it('soft-deletes a location', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const location = await createLocation(team.id)
      const caller = createCaller({
        session: createSessionContext(user),
      })
      await expect(
        caller.location.delete({
          id: location.id,
        }),
      ).resolves.toMatchObject({
        id: location.id,
        deletedAt: expect.any(Date),
        deletedById: user.id,
      })
      await expect(
        testDb.location.findUnique({
          where: {
            id: location.id,
          },
        }),
      ).resolves.toMatchObject({
        deletedById: user.id,
      })
    })
  })

  describe('restore', () => {
    it('restores a deleted location', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const location = await createLocation(team.id)
      const caller = createCaller({
        session: createSessionContext(user),
      })
      await caller.location.delete({
        id: location.id,
      })
      await expect(
        caller.location.restore({
          id: location.id,
        }),
      ).resolves.toMatchObject({
        id: location.id,
        deletedAt: null,
        deletedById: null,
      })
    })
  })
})
