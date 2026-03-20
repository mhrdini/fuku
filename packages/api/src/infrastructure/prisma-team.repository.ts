import { db as PrismaClient } from '@fuku/db'
import {
  Assignment,
  Period,
  TeamRepository,
  Unavailability,
} from '@fuku/scheduling'

import {
  RuleConditionOutput,
  RuleConditionOutputSchema,
} from '../schemas/ruleCondition'

export class PrismaTeamRepository implements TeamRepository {
  constructor(private db: typeof PrismaClient) {}
  async getTeamSnapshot(
    teamId: string,
    period: Period,
    preloaded?: {
      assignments?: Assignment[]
      unavailabilities?: Unavailability[]
    },
  ) {
    const team = await this.db.team.findUniqueOrThrow({
      where: { id: teamId },
      select: {
        id: true,
        teamMembers: {
          select: {
            id: true,
            payGradeId: true,
          },
          where: {
            deletedAt: null,
            payGradeId: {
              not: null,
            },
          },
        },
        payGrades: {
          select: {
            id: true,
            baseRate: true,
            eligibleShiftTypes: {
              select: {
                shiftTypeId: true,
              },
            },
          },
        },
        shiftTypes: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
            allowedWeekdays: true,
          },
        },
        operationalHours: {
          select: {
            weekday: true,
            startTime: true,
            endTime: true,
          },
        },
        staffingRequirements: {
          select: {
            weekday: true,
            minMembers: true,
            maxMembers: true,
          },
        },
      },
    })

    const payGradeShiftTypes = team.payGrades.flatMap(pg =>
      pg.eligibleShiftTypes.map(est => ({
        payGradeId: pg.id,
        shiftTypeId: est.shiftTypeId,
      })),
    )

    const rulesRaw = await this.db.rule.findMany({
      where: { teamId },
      include: { ruleConditions: true },
    })

    const rules = rulesRaw.map(rule => ({
      ...rule,
      penalty: rule.penalty ?? null,
      payGradeId: rule.payGradeId ?? null,
      shiftTypeId: rule.shiftTypeId ?? null,
      teamMemberId: rule.teamMemberId ?? null,
      ruleConditions: rule.ruleConditions
        .map(rc => RuleConditionOutputSchema.parse(rc))
        .filter(
          (
            rc,
          ): rc is RuleConditionOutput & {
            value: NonNullable<typeof rc.value>
          } => rc.value !== null,
        ), // only include conditions with non-null value
    }))

    const unavailabilities: Unavailability[] = preloaded?.unavailabilities
      ? preloaded.unavailabilities
      : await this.db.unavailability
          .findMany({
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
          .then(unavailabilities =>
            unavailabilities.map(u => ({
              teamMemberId: u.teamMemberId,
              date: u.date,
            })),
          )

    const assignments: Assignment[] = preloaded?.assignments
      ? preloaded.assignments
      : await this.db.dayAssignment
          .findMany({
            where: {
              teamMember: {
                teamId,
              },
              shiftAssignment: {
                isNot: null,
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
              leaveAssignment: true,
            },
          })
          .then(assignments =>
            assignments.map(a => ({
              date: a.date,
              teamMemberId: a.teamMemberId,
              shiftTypeId: a.shiftAssignment!.shiftTypeId,
            })),
          )

    return {
      team: { id: team.id },
      teamMembers: team.teamMembers.map(m => ({
        id: m.id,
        payGradeId: m.payGradeId,
      })),
      payGrades: team.payGrades.map(pg => ({
        id: pg.id,
        baseRate: pg.baseRate,
      })),
      shiftTypes: team.shiftTypes.map(st => ({
        id: st.id,
        startTime: st.startTime,
        endTime: st.endTime,
        allowedWeekdays: st.allowedWeekdays,
      })),
      payGradeShiftTypes,
      rules,
      operationalHours: team.operationalHours,
      staffingRequirements: team.staffingRequirements,
      unavailabilities,
      assignments,
      period: period,
    }
  }
  async persistSchedule(
    teamId: string,
    period: Period,
    assignments: Assignment[],
  ) {
    await this.db.dayAssignment.createMany({
      data: assignments.map(a => ({
        teamMemberId: a.teamMemberId,
        date: a.date,
        shiftAssignment: {
          create: {
            teamId,
            shiftTypeId: a.shiftTypeId!,
          },
        },
      })),
    })
  }
}
