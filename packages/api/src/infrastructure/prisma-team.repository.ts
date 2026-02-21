import { db as PrismaClient } from '@fuku/db'
import { Period, TeamRepository } from '@fuku/scheduling'

export class PrismaTeamRepository implements TeamRepository {
  constructor(private db: typeof PrismaClient) {}
  async getTeamSnapshot(teamId: string, period: Period) {
    const team = await this.db.team.findUniqueOrThrow({
      where: { id: teamId },
      select: {
        id: true,
        teamMembers: {
          select: {
            id: true,
            payGradeId: true,
            deletedAt: true,
          },
        },
        payGrades: {
          select: {
            id: true,
            baseRate: true,
          },
        },
        shiftTypes: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
          },
        },
        operationalHours: {
          select: {
            dayOfWeek: true,
            startTime: true,
            endTime: true,
          },
        },
      },
    })

    const unavailabilities = await this.db.unavailability.findMany({
      where: {
        teamMember: {
          teamId,
        },
        date: {
          gte: period.start,
          lte: period.end,
        },
      },
    })

    const assignments = await this.db.dayAssignment.findMany({
      where: {
        teamMember: {
          teamId,
        },
        date: {
          gte: period.start,
          lte: period.end,
        },
      },
      select: {
        date: true,
        teamMemberId: true,
        shiftAssignment: true,
      },
    })

    return {
      team: { id: team.id },
      teamMembers: team.teamMembers.map(m => ({
        id: m.id,
        payGradeId: m.payGradeId,
        isActive: m.deletedAt === null,
      })),
      payGrades: team.payGrades.map(pg => ({
        id: pg.id,
        baseRate: pg.baseRate,
      })),
      shiftTypes: team.shiftTypes.map(st => ({
        id: st.id,
        startTime: st.startTime,
        endTime: st.endTime,
      })),
      operationalHours: team.operationalHours,
      unavailabilities: unavailabilities.map(u => ({
        teamMemberId: u.teamMemberId,
        date: u.date,
      })),
      assignments: assignments.map(a => ({
        date: a.date,
        teamMemberId: a.teamMemberId,
        shiftTypeId: a.shiftAssignment?.shiftTypeId || null, // TODO: handle this better
      })),
      period: period,
    }
  }
}
