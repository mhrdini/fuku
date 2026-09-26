import { testDb } from '@fuku/db/testing'
import { createOperationalHour, createTeam, createUser } from '@fuku/db/testing/factories'
import { describe, expect, it } from 'vitest'

import type { Weekday } from '@fuku/domain/schemas'

import { createCaller } from '../helpers/caller'
import { createSessionContext } from '../helpers/context'

describe('operational hour', () => {
  describe('list', () => {
    it('returns operational hours grouped by weekday', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const monday = await createOperationalHour(team.id, 1)
      const tuesday = await createOperationalHour(team.id, 2)
      const caller = createCaller({
        session: createSessionContext(user),
      })
      await expect(
        caller.operationalHour.list({
          teamId: team.id,
        }),
      ).resolves.toMatchObject({
        1: expect.objectContaining({
          teamId: team.id,
          startTime: monday.startTime,
          endTime: monday.endTime,
        }),
        2: expect.objectContaining({
          teamId: team.id,
          startTime: tuesday.startTime,
          endTime: tuesday.endTime,
        }),
      })
    })
    it('includes deleted operational hours', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const operationalHour = await createOperationalHour(team.id, 1)
      const caller = createCaller({
        session: createSessionContext(user),
      })
      await testDb.operationalHour.update({
        where: {
          teamId_weekday: {
            teamId: team.id,
            weekday: operationalHour.weekday,
          },
        },
        data: {
          deletedAt: new Date(),
          deletedById: user.id,
        },
      })
      await expect(
        caller.operationalHour.list({
          teamId: team.id,
        }),
      ).resolves.toMatchObject({
        [operationalHour.weekday]: expect.objectContaining({
          deletedAt: expect.any(Date),
        }),
      })
    })
  })
  describe('listActive', () => {
    it('returns only active operational hours grouped by weekday', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const operationalHour = await createOperationalHour(team.id, 1)
      const caller = createCaller({
        session: createSessionContext(user),
      })
      await testDb.operationalHour.update({
        where: {
          teamId_weekday: {
            teamId: team.id,
            weekday: operationalHour.weekday,
          },
        },
        data: {
          deletedAt: new Date(),
          deletedById: user.id,
        },
      })
      await expect(
        caller.operationalHour.listActive({
          teamId: team.id,
        }),
      ).resolves.not.toHaveProperty(
        String(operationalHour.weekday),
      )
    })
  })
  describe('create', () => {
    it('creates an operational hour', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const caller = createCaller({
        session: createSessionContext(user),
      })
      await expect(
        caller.operationalHour.create({
          teamId: team.id,
          weekday: 1,
          startTime: '09:00',
          endTime: '17:00',
        }),
      ).resolves.toMatchObject({
        teamId: team.id,
        weekday: 1,
        startTime: '09:00',
        endTime: '17:00',
      })
    })
  })
  describe('update', () => {
    it('updates an existing operational hour', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const operationalHour = await createOperationalHour(team.id, 1)
      const caller = createCaller({
        session: createSessionContext(user),
      })
      await expect(
        caller.operationalHour.update({
          teamId: team.id,
          weekday: operationalHour.weekday as Weekday,
          startTime: '10:00',
          endTime: '18:00',
        }),
      ).resolves.toMatchObject({
        teamId: team.id,
        weekday: operationalHour.weekday,
        startTime: '10:00',
        endTime: '18:00',
      })
    })
  })
  describe('setHours', () => {
    it('creates missing operational hours', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const caller = createCaller({
        session: createSessionContext(user),
      })
      await caller.operationalHour.setHours({
        teamId: team.id,
        operationalHours: {
          1: {
            teamId: team.id,
            startTime: '09:00',
            endTime: '17:00',
            deletedAt: null,
          },
        },
      })
      await expect(
        testDb.operationalHour.findUnique({
          where: {
            teamId_weekday: {
              teamId: team.id,
              weekday: 1,
            },
          },
        }),
      ).resolves.toMatchObject({
        startTime: '09:00',
        endTime: '17:00',
        deletedAt: null,
        deletedById: null,
      })
    })
    it('updates existing operational hours', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      await createOperationalHour(team.id, 1, {
        startTime: '09:00',
        endTime: '17:00',
      })
      const caller = createCaller({
        session: createSessionContext(user),
      })
      await caller.operationalHour.setHours({
        teamId: team.id,
        operationalHours: {
          1: {
            teamId: team.id,
            startTime: '10:00',
            endTime: '18:00',
            deletedAt: null,
          },
        },
      })
      await expect(
        testDb.operationalHour.findUnique({
          where: {
            teamId_weekday: {
              teamId: team.id,
              weekday: 1,
            },
          },
        }),
      ).resolves.toMatchObject({
        startTime: '10:00',
        endTime: '18:00',
      })
    })
    it('marks omitted operational hours as deleted', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const operationalHour = await createOperationalHour(team.id, 1)
      const caller = createCaller({
        session: createSessionContext(user),
      })
      await caller.operationalHour.setHours({
        teamId: team.id,
        operationalHours: {},
      })
      await expect(
        testDb.operationalHour.findUnique({
          where: {
            teamId_weekday: {
              teamId: team.id,
              weekday: operationalHour.weekday,
            },
          },
        }),
      ).resolves.toMatchObject({
        deletedAt: expect.any(Date),
        deletedById: user.id,
      })
    })
    it('restores a previously deleted operational hour', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const operationalHour = await createOperationalHour(team.id, 1)
      const caller = createCaller({
        session: createSessionContext(user),
      })
      await testDb.operationalHour.update({
        where: {
          teamId_weekday: {
            teamId: team.id,
            weekday: operationalHour.weekday,
          },
        },
        data: {
          deletedAt: new Date(),
          deletedById: user.id,
        },
      })
      await caller.operationalHour.setHours({
        teamId: team.id,
        operationalHours: {
          [operationalHour.weekday]: {
            teamId: team.id,
            weekday: operationalHour.weekday,
            startTime: operationalHour.startTime,
            endTime: operationalHour.endTime,
            deletedAt: null,
          },
        },
      })
      await expect(
        testDb.operationalHour.findUnique({
          where: {
            teamId_weekday: {
              teamId: team.id,
              weekday: operationalHour.weekday,
            },
          },
        }),
      ).resolves.toMatchObject({
        deletedAt: null,
        deletedById: null,
      })
    })
    it('marks supplied deleted operational hours with the session user', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const caller = createCaller({
        session: createSessionContext(user),
      })
      await caller.operationalHour.setHours({
        teamId: team.id,
        operationalHours: {
          1: {
            teamId: team.id,
            startTime: '09:00',
            endTime: '17:00',
            deletedAt: new Date(),
          },
        },
      })
      await expect(
        testDb.operationalHour.findUnique({
          where: {
            teamId_weekday: {
              teamId: team.id,
              weekday: 1,
            },
          },
        }),
      ).resolves.toMatchObject({
        deletedAt: expect.any(Date),
        deletedById: user.id,
      })
    })
  })
})
