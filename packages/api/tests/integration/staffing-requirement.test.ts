import { testDb } from '@fuku/db/testing'
import { createStaffingRequirement, createTeam, createUser } from '@fuku/db/testing/factories'
import { describe, expect, it } from 'vitest'

import type { Weekday } from '@fuku/domain/schemas'

import { createCaller } from '../helpers/caller'
import { createSessionContext } from '../helpers/context'

describe('staffing requirement', () => {
  describe('list', () => {
    it('returns staffing requirements grouped by weekday', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const monday = await createStaffingRequirement(team.id, 1, {
        minMembers: 2,
        maxMembers: 5,
      })
      const tuesday = await createStaffingRequirement(team.id, 2, {
        minMembers: 1,
        maxMembers: 4,
      })
      const caller = createCaller({
        session: createSessionContext(user),
      })
      await expect(
        caller.staffingRequirement.list({
          teamId: team.id,
        }),
      ).resolves.toStrictEqual({
        [monday.weekday]: {
          teamId: team.id,
          minMembers: 2,
          maxMembers: 5,
        },
        [tuesday.weekday]: {
          teamId: team.id,
          minMembers: 1,
          maxMembers: 4,
        },
      })
    })

    it('does not return staffing requirements from another team', async () => {
      const userA = await createUser()
      const teamA = await createTeam(userA.id)
      const userB = await createUser()
      const teamB = await createTeam(userB.id)
      await createStaffingRequirement(teamB.id, 1)
      const callerA = createCaller({
        session: createSessionContext(userA),
      })
      await expect(
        callerA.staffingRequirement.list({
          teamId: teamA.id,
        }),
      ).resolves.toStrictEqual({})
    })
  })

  describe('setStaffing', () => {
    it('creates missing staffing requirements', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const caller = createCaller({
        session: createSessionContext(user),
      })
      await caller.staffingRequirement.setStaffing({
        teamId: team.id,
        staffingRequirements: {
          1: {
            teamId: team.id,
            minMembers: 2,
            maxMembers: 5,
          },
        },
      })
      await expect(
        testDb.staffingRequirement.findUnique({
          where: {
            teamId_weekday: {
              teamId: team.id,
              weekday: 1,
            },
          },
        }),
      ).resolves.toMatchObject({
        teamId: team.id,
        weekday: 1,
        minMembers: 2,
        maxMembers: 5,
      })
    })

    it('updates existing staffing requirements', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      await createStaffingRequirement(team.id, 1, {
        minMembers: 1,
        maxMembers: 3,
      })
      const caller = createCaller({
        session: createSessionContext(user),
      })
      await caller.staffingRequirement.setStaffing({
        teamId: team.id,
        staffingRequirements: {
          1: {
            teamId: team.id,
            minMembers: 2,
            maxMembers: 5,
          },
        },
      })
      await expect(
        testDb.staffingRequirement.findUnique({
          where: {
            teamId_weekday: {
              teamId: team.id,
              weekday: 1,
            },
          },
        }),
      ).resolves.toMatchObject({
        minMembers: 2,
        maxMembers: 5,
      })
    })

    it('sets staffing requirements for multiple weekdays', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const caller = createCaller({
        session: createSessionContext(user),
      })
      await caller.staffingRequirement.setStaffing({
        teamId: team.id,
        staffingRequirements: {
          1: {
            teamId: team.id,
            minMembers: 2,
            maxMembers: 5,
          },
          2: {
            teamId: team.id,
            minMembers: 1,
            maxMembers: 4,
          },
        },
      })
      await expect(
        caller.staffingRequirement.list({
          teamId: team.id,
        }),
      ).resolves.toStrictEqual({
        1: {
          teamId: team.id,
          minMembers: 2,
          maxMembers: 5,
        },
        2: {
          teamId: team.id,
          minMembers: 1,
          maxMembers: 4,
        },
      })
    })

    it('allows minimum or maximum members to be set to zero', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      await createStaffingRequirement(team.id, 1, {
        minMembers: 2,
        maxMembers: 5,
      })
      const caller = createCaller({
        session: createSessionContext(user),
      })
      await caller.staffingRequirement.setStaffing({
        teamId: team.id,
        staffingRequirements: {
          1: {
            teamId: team.id,
            minMembers: 0,
            maxMembers: 0,
          },
        },
      })
      await expect(
        testDb.staffingRequirement.findUnique({
          where: {
            teamId_weekday: {
              teamId: team.id,
              weekday: 1,
            },
          },
        }),
      ).resolves.toMatchObject({
        minMembers: 0,
        maxMembers: 0,
      })
    })
  })

  describe('delete', () => {
    it('deletes a staffing requirement for a weekday', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const staffingRequirement = await createStaffingRequirement(team.id, 1)
      const caller = createCaller({
        session: createSessionContext(user),
      })
      await expect(
        caller.staffingRequirement.delete({
          teamId: team.id,
          weekday: staffingRequirement.weekday as Weekday,
        }),
      ).resolves.toMatchObject({
        weekday: staffingRequirement.weekday,
      })
      await expect(
        testDb.staffingRequirement.findUnique({
          where: {
            teamId_weekday: {
              teamId: team.id,
              weekday: staffingRequirement.weekday,
            },
          },
        }),
      ).resolves.toBeNull()
    })
  })
})
