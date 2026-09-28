import { testDb } from '@fuku/db/testing'
import {
  createTeam,
  createTeamMember,
  createUnavailability,
  createUser,
} from '@fuku/db/testing/factories'
import { describe, expect, it } from 'vitest'

import { createCaller } from '../helpers/caller'
import { createSessionContext } from '../helpers/context'

describe('unavailability', () => {
  describe('list', () => {
    it('returns unavailabilities for team members within the date range', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const teamMember = await createTeamMember(team.id)

      const start = new Date('2026-01-01T00:00:00.000Z')
      const end = new Date('2026-01-31T23:59:59.999Z')

      const unavailability = await createUnavailability(teamMember.id, {
        date: new Date('2026-01-15T00:00:00.000Z'),
        reason: 'Holiday',
      })

      const caller = createCaller({
        session: createSessionContext(user),
      })

      await expect(
        caller.unavailability.list({
          teamId: team.id,
          start,
          end,
        }),
      ).resolves.toEqual([
        expect.objectContaining({
          id: unavailability.id,
          teamMemberId: teamMember.id,
          date: unavailability.date,
          reason: 'Holiday',
        }),
      ])
    })

    it('excludes unavailabilities outside the date range', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const teamMember = await createTeamMember(team.id)

      const start = new Date('2026-01-01T00:00:00.000Z')
      const end = new Date('2026-01-31T23:59:59.999Z')

      const unavailability = await createUnavailability(teamMember.id, {
        date: new Date('2026-02-01T00:00:00.000Z'),
      })

      const caller = createCaller({
        session: createSessionContext(user),
      })

      const result = await caller.unavailability.list({
        teamId: team.id,
        start,
        end,
      })

      expect(result).not.toContainEqual(
        expect.objectContaining({ id: unavailability.id }),
      )
    })

    it('excludes unavailabilities for deleted team members', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const teamMember = await createTeamMember(team.id)

      const unavailability = await createUnavailability(teamMember.id, {
        date: new Date('2026-01-15T00:00:00.000Z'),
      })

      await testDb.teamMember.update({
        where: { id: teamMember.id },
        data: { deletedAt: new Date() },
      })

      const caller = createCaller({
        session: createSessionContext(user),
      })

      const result = await caller.unavailability.list({
        teamId: team.id,
        start: new Date('2026-01-01T00:00:00.000Z'),
        end: new Date('2026-01-31T23:59:59.999Z'),
      })

      expect(result).not.toContainEqual(
        expect.objectContaining({ id: unavailability.id }),
      )
    })

    it('returns null for a missing reason', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const teamMember = await createTeamMember(team.id)

      await createUnavailability(teamMember.id, {
        date: new Date('2026-01-15T00:00:00.000Z'),
        reason: null,
      })

      const caller = createCaller({
        session: createSessionContext(user),
      })

      await expect(
        caller.unavailability.list({
          teamId: team.id,
          start: new Date('2026-01-01T00:00:00.000Z'),
          end: new Date('2026-01-31T23:59:59.999Z'),
        }),
      ).resolves.toEqual([
        expect.objectContaining({
          teamMemberId: teamMember.id,
          reason: null,
        }),
      ])
    })
  })

  describe('create', () => {
    it('creates an unavailability', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const teamMember = await createTeamMember(team.id)

      const date = new Date('2026-01-15T00:00:00.000Z')

      const caller = createCaller({
        session: createSessionContext(user),
      })

      const result = await caller.unavailability.create({
        teamMemberId: teamMember.id,
        date,
        reason: 'Holiday',
      })

      expect(result).toEqual({
        id: expect.any(String),
        teamMemberId: teamMember.id,
        date,
        reason: 'Holiday',
      })
    })

    it('creates an unavailability without a reason', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const teamMember = await createTeamMember(team.id)

      const caller = createCaller({
        session: createSessionContext(user),
      })

      const result = await caller.unavailability.create({
        teamMemberId: teamMember.id,
        date: new Date('2026-01-15T00:00:00.000Z'),
        reason: null,
      })

      expect(result.reason).toBeNull()
    })
  })

  describe('createMany', () => {
    it('creates multiple unavailabilities', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const teamMember = await createTeamMember(team.id)

      const caller = createCaller({
        session: createSessionContext(user),
      })

      await expect(
        caller.unavailability.createMany([
          {
            teamMemberId: teamMember.id,
            date: new Date('2026-01-15T00:00:00.000Z'),
            reason: 'Holiday',
          },
          {
            teamMemberId: teamMember.id,
            date: new Date('2026-01-16T00:00:00.000Z'),
            reason: 'Personal',
          },
        ]),
      ).resolves.toEqual({ count: 2 })
    })

    it('skips duplicate unavailabilities', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const teamMember = await createTeamMember(team.id)

      const date = new Date('2026-01-15T00:00:00.000Z')

      await createUnavailability(teamMember.id, { date })

      const caller = createCaller({
        session: createSessionContext(user),
      })

      const result = await caller.unavailability.createMany([
        {
          teamMemberId: teamMember.id,
          date,
          reason: 'Holiday',
        },
      ])

      expect(result).toEqual({ count: 0 })
    })
  })

  describe('deleteById', () => {
    it('deletes an unavailability by id', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const teamMember = await createTeamMember(team.id)
      const unavailability = await createUnavailability(teamMember.id)

      const caller = createCaller({
        session: createSessionContext(user),
      })

      const result = await caller.unavailability.deleteById({
        id: unavailability.id,
      })

      expect(result).toEqual(
        expect.objectContaining({
          id: unavailability.id,
          teamMemberId: teamMember.id,
        }),
      )

      await expect(
        testDb.unavailability.findUnique({
          where: { id: unavailability.id },
        }),
      ).resolves.toBeNull()
    })
  })

  describe('delete', () => {
    it('deletes unavailabilities for a team member on a date', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const teamMember = await createTeamMember(team.id)
      const date = new Date('2026-01-15T00:00:00.000Z')

      await createUnavailability(teamMember.id, { date })

      const caller = createCaller({
        session: createSessionContext(user),
      })

      await expect(
        caller.unavailability.delete({
          teamMemberId: teamMember.id,
          date,
        }),
      ).resolves.toEqual({ count: 1 })

      await expect(
        testDb.unavailability.count({
          where: {
            teamMemberId: teamMember.id,
            date,
          },
        }),
      ).resolves.toBe(0)
    })
  })
})
