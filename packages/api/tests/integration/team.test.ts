import { testDb } from '@fuku/db/testing'
import { createTeam, createTeamMember, createUser } from '@fuku/db/testing/factories'
import { describe, expect, it } from 'vitest'

import { createCaller } from '../helpers/caller'
import { createSessionContext } from '../helpers/context'

describe('team', () => {
  describe('byId', () => {
    it('returns team by id', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const caller = createCaller({
        session: createSessionContext(user),
      })

      await expect(caller.team.byId({
        id: team.id,
      })).resolves.toMatchObject({
        id: team.id,
      })
    })

    it('scopes by authenticated user', async () => {
      const userA = await createUser()
      const team = await createTeam(userA.id)

      const userB = await createUser()
      const callerB = createCaller({
        session: createSessionContext(userB),
      })

      await expect(callerB.team.byId({
        id: team.id,
      })).resolves.toMatchObject({
        id: team.id,
      })
    })

    it('throws when attempting to query invalid id', async () => {
      const user = await createUser()
      const _ = await createTeam(user.id)
      const caller = createCaller({
        session: createSessionContext(user),
      })

      await expect(caller.team.byId({
        id: 'i-dont-exist',
      })).rejects.toThrow()
    })

    it('throws when attempting to query id of deleted team', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const caller = createCaller({
        session: createSessionContext(user),
      })

      await testDb.team.delete({
        where: { id: team.id },
      })

      await expect(caller.team.byId({
        id: team.id,
      })).rejects.toThrow()
    })
  })

  describe('byPublicId', () => {
    it('returns team by publicId', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const caller = createCaller({
        session: createSessionContext(user),
      })

      await expect(caller.team.byPublicId({
        publicId: team.publicId,
      })).resolves.toMatchObject({
        id: team.id,
      })
    })

    it('scopes by authenticated user', async () => {
      const userA = await createUser()
      const team = await createTeam(userA.id)

      const userB = await createUser()
      const callerB = createCaller({
        session: createSessionContext(userB),
      })

      await expect(callerB.team.byPublicId({
        publicId: team.publicId,
      })).resolves.toMatchObject({
        id: team.id,
      })
    })

    it('throws when attempting to query invalid publicId', async () => {
      const user = await createUser()
      const _ = await createTeam(user.id)
      const caller = createCaller({
        session: createSessionContext(user),
      })

      await expect(caller.team.byPublicId({
        publicId: 'i-dont-exist',
      })).rejects.toThrow()
    })

    it('throws when attempting to query publicId of deleted team', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const caller = createCaller({
        session: createSessionContext(user),
      })

      await testDb.team.delete({
        where: { publicId: team.publicId },
      })

      await expect(caller.team.byPublicId({
        publicId: team.publicId,
      })).rejects.toThrow()
    })

    it('rejects empty publicId', async () => {
      const user = await createUser()
      const _ = await createTeam(user.id)
      const caller = createCaller({
        session: createSessionContext(user),
      })

      await expect(caller.team.byPublicId({
        publicId: '',
      })).rejects.toThrow()
    })
  })

  describe('getActiveTeam', () => {
    it('scopes by active team member', async () => {
      const user = await createUser()
      const caller = createCaller({
        session: createSessionContext(user),
      })

      await expect(caller.team.getActiveTeam()).resolves.toBeNull()

      const team = await createTeam(user.id)
      await caller.user.setLastActiveTeam({
        teamId: team.id,
      })
      await expect(caller.team.getActiveTeam()).resolves.toMatchObject({
        id: team.id,
      })
    })

    it('switches to next team when user does not belong to active team', async () => {
      const userA = await createUser()
      const teamA = await createTeam(userA.id)

      const userB = await createUser()
      const teamB = await createTeam(userB.id)
      const callerB = createCaller({
        session: createSessionContext(userB),
      })

      await testDb.user.update({
        where: {
          id: userB.id,
        },
        data: {
          lastActiveTeamId: teamA.id,
        },
      })

      await expect(callerB.team.getActiveTeam()).resolves.toMatchObject({
        id: teamB.id,
      })

      await expect(
        testDb.user.findUnique({
          where: {
            id: userB.id,
          },
          select: {
            lastActiveTeamId: true,
          },
        }),
      ).resolves.toStrictEqual({
        lastActiveTeamId: teamB.id,
      })
    })

    it('switches to next team when active team is deleted', async () => {
      const user = await createUser()
      const teamA = await createTeam(user.id)
      const teamB = await createTeam(user.id)
      const caller = createCaller({
        session: createSessionContext(user),
      })

      await caller.user.setLastActiveTeam({
        teamId: teamA.id,
      })

      await testDb.team.update({
        where: {
          id: teamA.id,
        },
        data: {
          deletedAt: new Date(),
        },
      })

      await expect(caller.team.getActiveTeam()).resolves.toMatchObject({
        id: teamB.id,
      })

      await expect(
        testDb.user.findUnique({
          where: {
            id: user.id,
          },
          select: {
            lastActiveTeamId: true,
          },
        }),
      ).resolves.toStrictEqual({
        lastActiveTeamId: teamB.id,
      })
    })

    it('switches to next team when active team membership is deleted', async () => {
      const user = await createUser()
      const teamA = await createTeam(user.id)
      const teamB = await createTeam(user.id)
      const caller = createCaller({
        session: createSessionContext(user),
      })

      await caller.user.setLastActiveTeam({
        teamId: teamA.id,
      })

      await testDb.teamMember.updateMany({
        where: {
          teamId: teamA.id,
          userId: user.id,
        },
        data: {
          deletedAt: new Date(),
        },
      })

      await expect(caller.team.getActiveTeam()).resolves.toMatchObject({
        id: teamB.id,
      })

      await expect(
        testDb.user.findUnique({
          where: {
            id: user.id,
          },
          select: {
            lastActiveTeamId: true,
          },
        }),
      ).resolves.toStrictEqual({
        lastActiveTeamId: teamB.id,
      })
    })

    it('sets active team to null when no other team is available', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const caller = createCaller({
        session: createSessionContext(user),
      })

      await caller.user.setLastActiveTeam({
        teamId: team.id,
      })

      await testDb.team.update({
        where: {
          id: team.id,
        },
        data: {
          deletedAt: new Date(),
        },
      })

      await expect(caller.team.getActiveTeam()).resolves.toBeNull()

      await expect(
        testDb.user.findUnique({
          where: {
            id: user.id,
          },
          select: {
            lastActiveTeamId: true,
          },
        }),
      ).resolves.toStrictEqual({
        lastActiveTeamId: null,
      })
    })

    it('returns null when there is no active team', async () => {
      const user = await createUser()
      const caller = createCaller({
        session: createSessionContext(user),
      })

      await expect(caller.team.getActiveTeam()).resolves.toBeNull()

      await expect(
        testDb.user.findUnique({
          where: {
            id: user.id,
          },
          select: {
            lastActiveTeamId: true,
          },
        }),
      ).resolves.toStrictEqual({
        lastActiveTeamId: null,
      })
    })
  })

  describe('getAllOwned', () => {
    it('returns list of all teams the user is an admin of ordered by created date ascending', async () => {
      const userA = await createUser()
      const callerA = createCaller({
        session: createSessionContext(userA),
      })
      const teamA = await createTeam(userA.id)
      const teamB = await createTeam(userA.id)

      const userB = await createUser()
      const callerB = createCaller({
        session: createSessionContext(userB),
      })
      const teamC = await createTeam(userB.id)

      await callerA.teamMember.create({
        givenNames: userB.name,
        familyName: userB.name,
        teamId: teamA.id,
        teamMemberRole: 'STAFF',
        rateMultiplier: 1,
        username: userB.username,
      })

      await callerB.teamMember.create({
        givenNames: userA.name,
        familyName: userA.name,
        teamId: teamC.id,
        teamMemberRole: 'STAFF',
        rateMultiplier: 1,
        username: userA.username,
      })

      const userAOwnedTeams = await callerA.team.getAllOwned()
      const userBOwnedTeams = await callerB.team.getAllOwned()

      expect(userAOwnedTeams).toStrictEqual([
        teamA,
        teamB,
      ])

      expect(userBOwnedTeams).toStrictEqual([
        teamC,
      ])
    })

    it('excludes deleted teams', async () => {
      const user = await createUser()
      const caller = createCaller({
        session: createSessionContext(user),
      })
      const teamA = await createTeam(user.id)
      const teamB = await createTeam(user.id)
      const teamC = await createTeam(user.id)

      await caller.user.setLastActiveTeam({
        teamId: teamA.id,
      })
      await caller.team.delete()

      await expect(caller.team.getAllOwned()).resolves.toStrictEqual(
        [
          expect.objectContaining({ id: teamB.id }),
          expect.objectContaining({ id: teamC.id }),
        ],
      )
    })

    it('returns empty list when user owns no teams', async () => {
      const userA = await createUser()
      const callerA = createCaller({
        session: createSessionContext(userA),
      })

      const userB = await createUser()
      const teamB = await createTeam(userB.id)
      const _memberA = await createTeamMember(teamB.id, {
        teamMemberRole: 'STAFF',
        userId: userA.id,
      })

      await expect(callerA.team.getAllOwned()).resolves.toStrictEqual([])
    })
  })

  describe('getUserTeams', () => {
    it('returns list of all user teams for which user has memberships', async () => {
      const userA = await createUser()
      const callerA = createCaller({
        session: createSessionContext(userA),
      })
      const teamA = await createTeam(userA.id)
      const teamB = await createTeam(userA.id)

      const userB = await createUser()
      const callerB = createCaller({
        session: createSessionContext(userB),
      })
      const teamC = await createTeam(userB.id)

      await callerB.teamMember.create({
        givenNames: userA.name,
        familyName: userA.name,
        teamId: teamC.id,
        teamMemberRole: 'STAFF',
        rateMultiplier: 1,
        username: userA.username,
      })

      await expect(callerA.team.getUserTeams()).resolves.toStrictEqual([
        expect.objectContaining({
          id: teamA.id,
          teamMemberRole: 'ADMIN',
          teamMembersCount: 1,
        }),
        expect.objectContaining({
          id: teamB.id,
          teamMemberRole: 'ADMIN',
          teamMembersCount: 1,
        }),
        expect.objectContaining({
          id: teamC.id,
          teamMemberRole: 'STAFF',
          teamMembersCount: 2,
        }),
      ])

      await expect(callerB.team.getUserTeams()).resolves.toStrictEqual([
        expect.objectContaining({
          id: teamC.id,
          teamMemberRole: 'ADMIN',
          teamMembersCount: 2,
        }),
      ])
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
        teamMemberRole: 'ADMIN',
        rateMultiplier: 1,
        username: userA.username,
      })

      await callerA.user.setLastActiveTeam({ teamId: teamA.id })
      await callerA.team.delete()

      await expect(callerA.team.getUserTeams()).resolves.toStrictEqual([
        expect.objectContaining({ ...teamB }),
      ])
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
      const memberB = await callerB.teamMember.create({
        givenNames: userA.name,
        familyName: userA.name,
        teamId: teamB.id,
        teamMemberRole: 'ADMIN',
        rateMultiplier: 1,
        username: userA.username,
      })

      await expect(callerA.team.getUserTeams()).resolves.toStrictEqual([
        expect.objectContaining({ ...teamA }),
        expect.objectContaining({ ...teamB }),
      ])

      await callerB.user.setLastActiveTeam({ teamId: teamB.id })
      await callerB.teamMember.delete({
        id: memberB.id,
      })

      await expect(callerA.team.getUserTeams()).resolves.toStrictEqual([
        expect.objectContaining({ ...teamA }),
      ])
    })

    it('returns empty list when user has no teams', async () => {
      const userA = await createUser()
      const callerA = createCaller({
        session: createSessionContext(userA),
      })

      const userB = await createUser()
      const _teamA = await createTeam(userB.id)
      const _teamB = await createTeam(userB.id)

      const userTeams = await callerA.team.getUserTeams()
      expect(userTeams).toHaveLength(0)
      expect(userTeams).toStrictEqual([])
    })
  })

  describe('create', () => {
    it('creates team with provided details', async () => {
      const user = await createUser()
      const caller = createCaller({
        session: createSessionContext(user),
      })

      const result = await caller.team.create({
        name: 'Test Team',
        description: 'Test description',
        timeZone: 'Asia/Tokyo',
        locations: [
          {
            id: 'clientId',
            name: 'Main Location',
            color: '#000000',
          },
        ],
        shiftTypes: [
          {
            id: 'clientId',
            name: 'Morning',
            startTime: '09:00',
            endTime: '17:00',
          },
        ],
        payGrades: [],
        teamMembers: [],
      })

      expect(result).toMatchObject({
        name: 'Test Team',
        description: 'Test description',
        timeZone: 'Asia/Tokyo',
      })
    })

    it('generates unique publicId', async () => {
      const user = await createUser()
      const caller = createCaller({
        session: createSessionContext(user),
      })

      const teamA = await caller.team.create({
        name: 'Team A',
        description: '',
        timeZone: 'Asia/Tokyo',
        locations: [],
        shiftTypes: [],
        payGrades: [],
        teamMembers: [],
      })

      const teamB = await caller.team.create({
        name: 'Team B',
        description: '',
        timeZone: 'Asia/Tokyo',
        locations: [],
        shiftTypes: [],
        payGrades: [],
        teamMembers: [],
      })

      expect(teamA.publicId).not.toBe(teamB.publicId)
    })

    it('creates locations', async () => {
      const user = await createUser()
      const caller = createCaller({
        session: createSessionContext(user),
      })

      const result = await caller.team.create({
        name: 'Test Team',
        description: '',
        timeZone: 'Asia/Tokyo',
        locations: [
          {
            id: 'clientId1',
            name: 'Main Location',
            color: '#000000',
          },
          {
            id: 'clientId2',
            name: 'Second Location',
          },
        ],
        shiftTypes: [],
        payGrades: [],
        teamMembers: [],
      })

      await expect(
        testDb.location.findMany({
          where: {
            teamId: result.id,
          },
          orderBy: {
            name: 'asc',
          },
        }),
      ).resolves.toStrictEqual([
        expect.objectContaining({
          name: 'Main Location',
          color: '#000000',
        }),
        expect.objectContaining({
          name: 'Second Location',
        }),
      ])
    })

    it('creates shift types', async () => {
      const user = await createUser()
      const caller = createCaller({
        session: createSessionContext(user),
      })

      const result = await caller.team.create({
        name: 'Test Team',
        description: '',
        timeZone: 'Asia/Tokyo',
        locations: [],
        shiftTypes: [
          {
            id: 'clientId1',
            name: 'Morning',
            startTime: '09:00',
            endTime: '17:00',
          },
          {
            id: 'clientId2',
            name: 'Evening',
            startTime: '17:00',
            endTime: '23:00',
          },
        ],
        payGrades: [],
        teamMembers: [],
      })

      await expect(
        testDb.shiftType.findMany({
          where: {
            teamId: result.id,
          },
          orderBy: {
            name: 'asc',
          },
        }),
      ).resolves.toStrictEqual([
        expect.objectContaining({
          name: 'Evening',
          startTime: '17:00',
          endTime: '23:00',
        }),
        expect.objectContaining({
          name: 'Morning',
          startTime: '09:00',
          endTime: '17:00',
        }),
      ])
    })

    it('creates seven staffing requirements', async () => {
      const user = await createUser()
      const caller = createCaller({
        session: createSessionContext(user),
      })

      const result = await caller.team.create({
        name: 'Test Team',
        description: '',
        timeZone: 'Asia/Tokyo',
        locations: [],
        shiftTypes: [],
        payGrades: [],
        teamMembers: [],
      })

      const staffingRequirements = await testDb.staffingRequirement.findMany({
        where: {
          teamId: result.id,
        },
        orderBy: {
          weekday: 'asc',
        },
      })

      expect(staffingRequirements).toHaveLength(7)
      expect(staffingRequirements.map(requirement => requirement.weekday)).toStrictEqual([
        1,
        2,
        3,
        4,
        5,
        6,
        7,
      ])
    })

    it('creates pay grades', async () => {
      const user = await createUser()
      const caller = createCaller({
        session: createSessionContext(user),
      })

      const result = await caller.team.create({
        name: 'Test Team',
        description: '',
        timeZone: 'Asia/Tokyo',
        locations: [],
        shiftTypes: [],
        payGrades: [
          {
            id: 'junior',
            name: 'Junior',
            baseRate: 1200,
          },
          {
            id: 'senior',
            name: 'Senior',
            baseRate: 1500,
          },
        ],
        teamMembers: [],
      })

      await expect(
        testDb.payGrade.findMany({
          where: {
            teamId: result.id,
          },
          orderBy: {
            name: 'asc',
          },
        }),
      ).resolves.toStrictEqual([
        expect.objectContaining({
          name: 'Junior',
          baseRate: 1200,
        }),
        expect.objectContaining({
          name: 'Senior',
          baseRate: 1500,
        }),
      ])
    })

    it('maps client pay grade ids to created pay grade ids', async () => {
      const user = await createUser()
      const caller = createCaller({
        session: createSessionContext(user),
      })

      const result = await caller.team.create({
        name: 'Test Team',
        description: '',
        timeZone: 'Asia/Tokyo',
        locations: [],
        shiftTypes: [],
        payGrades: [
          {
            id: 'junior',
            name: 'Junior',
            baseRate: 1200,
          },
        ],
        teamMembers: [
          {
            id: 'clientId',
            familyName: 'Staff',
            givenNames: 'One',
            teamMemberRole: 'STAFF',
            rateMultiplier: 1,
            payGradeClientId: 'junior',
          },
        ],
      })

      const payGrade = await testDb.payGrade.findFirst({
        where: {
          id: result.payGrades.find(pg => pg.name === 'Junior')!.id,
        },
      })

      await expect(
        testDb.teamMember.findFirst({
          where: {
            teamId: result.id,
          },
          select: {
            payGradeId: true,
          },
        }),
      ).resolves.toStrictEqual({
        payGradeId: payGrade!.id,
      })
    })

    it('connects shift types to eligible pay grades', async () => {
      const user = await createUser()
      const caller = createCaller({
        session: createSessionContext(user),
      })

      const result = await caller.team.create({
        name: 'Test Team',
        description: '',
        timeZone: 'Asia/Tokyo',
        locations: [],
        shiftTypes: [
          {
            id: 'clientId',
            name: 'Morning',
            startTime: '09:00',
            endTime: '17:00',
            connectPayGrades: ['junior'],
          },
        ],
        payGrades: [
          {
            id: 'junior',
            name: 'Junior',
            baseRate: 1200,
          },
          {
            id: 'senior',
            name: 'Senior',
            baseRate: 1500,
          },
        ],
        teamMembers: [],
      })

      const shiftType = await testDb.shiftType.findFirst({
        where: {
          id: result.shiftTypes[0].id,
        },
      })

      const junior = await testDb.payGrade.findFirst({
        where: {
          id: result.payGrades.find(pg => pg.name === 'Junior')!.id,
        },
      })

      await expect(
        testDb.payGradeShiftType.findMany({
          where: {
            shiftTypeId: shiftType!.id,
          },
          select: {
            payGradeId: true,
            shiftTypeId: true,
          },
        }),
      ).resolves.toStrictEqual([
        {
          payGradeId: junior!.id,
          shiftTypeId: shiftType!.id,
        },
      ])
    })

    it('creates team members', async () => {
      const user = await createUser()
      const member = await createUser()
      const caller = createCaller({
        session: createSessionContext(user),
      })

      const result = await caller.team.create({
        name: 'Test Team',
        description: '',
        timeZone: 'Asia/Tokyo',
        locations: [],
        shiftTypes: [],
        payGrades: [],
        teamMembers: [
          {
            id: 'clientId',
            userId: member.id,
            familyName: member.name,
            givenNames: member.name,
            teamMemberRole: 'STAFF',
            rateMultiplier: 1,
          },
        ],
      })

      await expect(
        testDb.teamMember.findMany({
          where: {
            teamId: result.id,
          },
        }),
      ).resolves.toStrictEqual([
        expect.objectContaining({
          userId: member.id,
          teamMemberRole: 'STAFF',
          rateMultiplier: 1,
        }),
      ])
    })

    it('creates unlinked team members', async () => {
      const user = await createUser()
      const caller = createCaller({
        session: createSessionContext(user),
      })

      const result = await caller.team.create({
        name: 'Test Team',
        description: '',
        timeZone: 'Asia/Tokyo',
        locations: [],
        shiftTypes: [],
        payGrades: [],
        teamMembers: [
          {
            id: 'clientId',
            familyName: 'Doe',
            givenNames: 'John',
            teamMemberRole: 'STAFF',
            rateMultiplier: 1,
          },
        ],
      })

      await expect(
        testDb.teamMember.findFirst({
          where: {
            teamId: result.id,
          },
          select: {
            userId: true,
            familyName: true,
            givenNames: true,
          },
        }),
      ).resolves.toStrictEqual({
        userId: null,
        familyName: 'Doe',
        givenNames: 'John',
      })
    })

    it('updates current user\'s lastActiveTeamId', async () => {
      const user = await createUser()
      const caller = createCaller({
        session: createSessionContext(user),
      })

      const result = await caller.team.create({
        name: 'Test Team',
        description: '',
        timeZone: 'Asia/Tokyo',
        locations: [],
        shiftTypes: [],
        payGrades: [],
        teamMembers: [],
      })

      await expect(
        testDb.user.findUnique({
          where: {
            id: user.id,
          },
          select: {
            lastActiveTeamId: true,
          },
        }),
      ).resolves.toStrictEqual({
        lastActiveTeamId: result.id,
      })
    })

    it('connects admin team members to team admins', async () => {
      const user = await createUser()
      const admin = await createUser()
      const caller = createCaller({
        session: createSessionContext(user),
      })

      const result = await caller.team.create({
        name: 'Test Team',
        description: '',
        timeZone: 'Asia/Tokyo',
        locations: [],
        shiftTypes: [],
        payGrades: [],
        teamMembers: [
          {
            id: 'clientId',
            userId: admin.id,
            familyName: admin.name,
            givenNames: admin.name,
            teamMemberRole: 'ADMIN',
            rateMultiplier: 1,
          },
        ],
      })

      await expect(
        testDb.team.findUnique({
          where: {
            id: result.id,
          },
          select: {
            adminUsers: {
              where: {
                id: admin.id,
              },
              select: {
                id: true,
              },
            },
          },
        }),
      ).resolves.toStrictEqual({
        adminUsers: [{ id: admin.id }],
      })
    })
  })

  describe('update', () => {
    it('updates active team and updatedAt', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const caller = createCaller({
        session: createSessionContext(user),
      })

      const updatedAt = team.updatedAt

      await caller.team.update({
        name: 'Updated Team',
        description: 'Updated description',
        timeZone: 'Asia/Tokyo',
      })

      await expect(
        testDb.team.findUnique({
          where: {
            id: team.id,
          },
        }),
      ).resolves.toMatchObject({
        id: team.id,
        name: 'Updated Team',
        description: 'Updated description',
        timeZone: 'Asia/Tokyo',
      })

      const updatedTeam = await testDb.team.findUnique({
        where: {
          id: team.id,
        },
        select: {
          updatedAt: true,
        },
      })

      expect(updatedTeam!.updatedAt.getTime()).toBeGreaterThan(updatedAt.getTime())
    })

    it('rejects non-admin user', async () => {
      const owner = await createUser()
      const team = await createTeam(owner.id)

      const user = await createUser()
      await createTeamMember(team.id, {
        userId: user.id,
        teamMemberRole: 'STAFF',
      })

      const caller = createCaller({
        session: createSessionContext(user),
      })

      await caller.user.setLastActiveTeam({
        teamId: team.id,
      })

      await expect(
        caller.team.update({
          name: 'Updated Team',
        }),
      ).rejects.toThrow()
    })

    it('rejects when active team does not exist', async () => {
      const user = await createUser()
      const _team = await createTeam(user.id)
      const caller = createCaller({
        session: createSessionContext(user),
      })

      await testDb.user.update({
        where: {
          id: user.id,
        },
        data: {
          lastActiveTeamId: null,
        },
      })

      await expect(
        caller.team.update({
          name: 'Updated Team',
        }),
      ).rejects.toThrow()
    })

    it('rejects when active team is deleted', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const caller = createCaller({
        session: createSessionContext(user),
      })

      await testDb.team.update({
        where: {
          id: team.id,
        },
        data: {
          deletedAt: new Date(),
        },
      })

      await expect(
        caller.team.update({
          name: 'Updated Team',
        }),
      ).rejects.toThrow()
    })
  })

  describe('delete', () => {
    it('soft-deletes active team', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const caller = createCaller({
        session: createSessionContext(user),
      })

      await caller.team.delete()

      await expect(
        testDb.team.findUnique({
          where: {
            id: team.id,
          },
          select: {
            deletedAt: true,
            deletedById: true,
          },
        }),
      ).resolves.toMatchObject({
        deletedById: user.id,
      })

      const deletedTeam = await testDb.team.findUnique({
        where: {
          id: team.id,
        },
        select: {
          deletedAt: true,
        },
      })

      expect(deletedTeam!.deletedAt).toBeInstanceOf(Date)
    })

    it('soft-deletes team members', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      await createTeamMember(team.id)

      const caller = createCaller({
        session: createSessionContext(user),
      })

      await caller.team.delete()

      const members = await testDb.teamMember.findMany({
        where: {
          teamId: team.id,
        },
        select: {
          deletedAt: true,
          deletedById: true,
        },
      })

      expect(members).toHaveLength(2)
      expect(members.every(member => member.deletedAt instanceof Date)).toBe(true)
      expect(members.every(member => member.deletedById === user.id)).toBe(true)
    })

    it('soft-deletes locations', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)

      const location = await testDb.location.create({
        data: {
          teamId: team.id,
          name: 'Main Location',
        },
      })

      const caller = createCaller({
        session: createSessionContext(user),
      })

      await caller.team.delete()

      await expect(
        testDb.location.findUnique({
          where: {
            id: location.id,
          },
          select: {
            deletedAt: true,
            deletedById: true,
          },
        }),
      ).resolves.toMatchObject({
        deletedById: user.id,
      })
    })

    it('soft-deletes shift types', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)

      const shiftType = await testDb.shiftType.create({
        data: {
          teamId: team.id,
          name: 'Morning',
          startTime: '09:00',
          endTime: '17:00',
        },
      })

      const caller = createCaller({
        session: createSessionContext(user),
      })

      await caller.team.delete()

      await expect(
        testDb.shiftType.findUnique({
          where: {
            id: shiftType.id,
          },
          select: {
            deletedAt: true,
            deletedById: true,
          },
        }),
      ).resolves.toMatchObject({
        deletedById: user.id,
      })
    })

    it('clears pay grade references from team members', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const payGrade = await testDb.payGrade.create({
        data: {
          teamId: team.id,
          name: 'Standard',
          baseRate: 1200,
        },
      })

      const member = await createTeamMember(team.id, {
        payGradeId: payGrade.id,
      })

      const caller = createCaller({
        session: createSessionContext(user),
      })

      await caller.team.delete()

      await expect(
        testDb.teamMember.findUnique({
          where: {
            id: member.id,
          },
          select: {
            payGradeId: true,
          },
        }),
      ).resolves.toStrictEqual({
        payGradeId: null,
      })
    })

    it('deletes pay grades', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)

      await testDb.payGrade.create({
        data: {
          teamId: team.id,
          name: 'Standard',
          baseRate: 1200,
        },
      })

      const caller = createCaller({
        session: createSessionContext(user),
      })

      await caller.team.delete()

      await expect(
        testDb.payGrade.count({
          where: {
            teamId: team.id,
          },
        }),
      ).resolves.toBe(0)
    })

    it('switches to earliest remaining team', async () => {
      const user = await createUser()
      const teamA = await createTeam(user.id)
      const teamB = await createTeam(user.id)
      const teamC = await createTeam(user.id)
      const caller = createCaller({
        session: createSessionContext(user),
      })

      await caller.user.setLastActiveTeam({
        teamId: teamB.id,
      })

      await caller.team.delete()

      await expect(
        testDb.user.findUnique({
          where: {
            id: user.id,
          },
          select: {
            lastActiveTeamId: true,
          },
        }),
      ).resolves.toStrictEqual({
        lastActiveTeamId: teamA.id,
      })

      await expect(
        testDb.team.findUnique({
          where: {
            id: teamB.id,
          },
          select: {
            deletedAt: true,
          },
        }),
      ).resolves.toMatchObject({
        deletedAt: expect.any(Date),
      })

      await expect(
        testDb.team.findUnique({
          where: {
            id: teamC.id,
          },
          select: {
            deletedAt: true,
          },
        }),
      ).resolves.toStrictEqual({
        deletedAt: null,
      })
    })

    it('sets lastActiveTeamId to null when no teams remain', async () => {
      const user = await createUser()
      const _team = await createTeam(user.id)
      const caller = createCaller({
        session: createSessionContext(user),
      })

      await caller.team.delete()

      await expect(
        testDb.user.findUnique({
          where: {
            id: user.id,
          },
          select: {
            lastActiveTeamId: true,
          },
        }),
      ).resolves.toStrictEqual({
        lastActiveTeamId: null,
      })
    })

    it('rejects non-admin user', async () => {
      const owner = await createUser()
      const team = await createTeam(owner.id)

      const user = await createUser()
      await createTeamMember(team.id, {
        userId: user.id,
        teamMemberRole: 'STAFF',
      })

      const caller = createCaller({
        session: createSessionContext(user),
      })

      await caller.user.setLastActiveTeam({
        teamId: team.id,
      })

      await expect(caller.team.delete()).rejects.toThrow()
    })

    it('rejects when active team does not exist', async () => {
      const user = await createUser()
      await createTeam(user.id)
      const caller = createCaller({
        session: createSessionContext(user),
      })

      await testDb.user.update({
        where: {
          id: user.id,
        },
        data: {
          lastActiveTeamId: null,
        },
      })

      await expect(caller.team.delete()).rejects.toThrow()
    })

    it('rejects when active team is already deleted', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const caller = createCaller({
        session: createSessionContext(user),
      })

      await testDb.team.update({
        where: {
          id: team.id,
        },
        data: {
          deletedAt: new Date(),
        },
      })

      await expect(caller.team.delete()).rejects.toThrow()
    })
  })

  describe('restore', () => {
    it('restores deleted team', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const caller = createCaller({
        session: createSessionContext(user),
      })

      await testDb.team.update({
        where: {
          id: team.id,
        },
        data: {
          deletedAt: new Date(),
          deletedById: user.id,
        },
      })

      await expect(
        caller.team.restore({
          id: team.id,
        }),
      ).resolves.toMatchObject({
        id: team.id,
        deletedAt: null,
        deletedById: null,
      })
    })

    it('clears deletedAt and deletedById', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const deletedAt = new Date()
      const caller = createCaller({
        session: createSessionContext(user),
      })

      await testDb.team.update({
        where: {
          id: team.id,
        },
        data: {
          deletedAt,
          deletedById: user.id,
        },
      })

      await caller.team.restore({
        id: team.id,
      })

      await expect(
        testDb.team.findUnique({
          where: {
            id: team.id,
          },
          select: {
            deletedAt: true,
            deletedById: true,
          },
        }),
      ).resolves.toStrictEqual({
        deletedAt: null,
        deletedById: null,
      })
    })

    it('rejects non-admin user', async () => {
      const owner = await createUser()
      const team = await createTeam(owner.id)

      const user = await createUser()
      const caller = createCaller({
        session: createSessionContext(user),
      })

      await expect(
        caller.team.restore({
          id: team.id,
        }),
      ).rejects.toThrow()
    })

    it('rejects non-existent team', async () => {
      const user = await createUser()
      const caller = createCaller({
        session: createSessionContext(user),
      })

      await expect(
        caller.team.restore({
          id: 'does-not-exist',
        }),
      ).rejects.toThrow()
    })

    it('rejects non-deleted team', async () => {
      const user = await createUser()
      const team = await createTeam(user.id)
      const caller = createCaller({
        session: createSessionContext(user),
      })

      await expect(
        caller.team.restore({
          id: team.id,
        }),
      ).rejects.toThrow()
    })

    it('rejects team owned by another user', async () => {
      const owner = await createUser()
      const team = await createTeam(owner.id)

      const user = await createUser()
      const caller = createCaller({
        session: createSessionContext(user),
      })

      await testDb.team.update({
        where: {
          id: team.id,
        },
        data: {
          deletedAt: new Date(),
          deletedById: owner.id,
        },
      })

      await expect(
        caller.team.restore({
          id: team.id,
        }),
      ).rejects.toThrow()
    })
  })
})
