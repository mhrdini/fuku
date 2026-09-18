import { TeamMemberOutputSchema } from '@fuku/api/schemas'
import i18next from '@fuku/i18n/server'
import * as z from 'zod/v4'

import type { TeamMemberData } from './schedule'
import type { TeamMemberOutput } from '@fuku/api/schemas'

// from the procedure and also with UI-specific fields
export const TeamMemberUISchema = TeamMemberOutputSchema.extend({
  // UI-specific fields
  fullName: z.string(),
  payGradeName: z.string(),
  baseRate: z.number().nullish(),
  effectiveRate: z.number().nullish(),
  username: z.string().nullish(),
})

export type TeamMemberUI = z.infer<typeof TeamMemberUISchema>

export function toTeamMemberUI(m: NonNullable<TeamMemberOutput>): TeamMemberUI {
  return {
    ...m,
    fullName: i18next.t('givennamesFamilyname', '{{givenNames}} {{familyName}}', {
      givenNames: m.givenNames,
      familyName: m.familyName,
    }),
    payGradeName: m.payGrade?.name ?? 'Unassigned',
    baseRate: m.payGrade?.baseRate ?? null,
    effectiveRate: m.payGrade ? m.payGrade.baseRate * m.rateMultiplier : null,
    username: m.user ? m.user.username : null,
  }
}

export function getTeamMemberName(tm: TeamMemberOutput | TeamMemberUI): string {
  return i18next.t('givennamesFamilyname', '{{givenNames}} {{familyName}}', {
    givenNames: tm.givenNames,
    familyName: tm.familyName,
  })
}

export function getTeamMemberTotalEarnings(tm: TeamMemberData): number {
  return tm.totalHours * (tm.payGrade ? tm.payGrade.baseRate : 0)
}

// team member sorting
export const TEAM_MEMBER_SORT_KEYS = [
  'name',
  'totalShifts',
  'totalHours',
  'totalEarnings',
  'payGrade',
] as const

export type TeamMemberSortKey = (typeof TEAM_MEMBER_SORT_KEYS)[number]

export const TEAM_MEMBER_SORT_COMPARATORS: Record<
  TeamMemberSortKey,
  (a: TeamMemberData, b: TeamMemberData) => number
> = {
  name: (a, b) => getTeamMemberName(a).localeCompare(getTeamMemberName(b)),
  totalShifts: (a, b) => a.totalAssignedShifts - b.totalAssignedShifts,
  totalHours: (a, b) => a.totalHours - b.totalHours,
  totalEarnings: (a, b) =>
    getTeamMemberTotalEarnings(a) - getTeamMemberTotalEarnings(b),
  payGrade: (a, b) =>
    (a.payGrade ? a.payGrade.name : '').localeCompare(b.payGrade?.name ?? ''),
}

export function sortTeamMembers(
  tms: TeamMemberData[],
  sortBy: TeamMemberSortKey | undefined,
  direction: 'asc' | 'desc' = 'asc',
): TeamMemberData[] {
  if (!sortBy)
    return tms
  const sorted = [...tms].sort(TEAM_MEMBER_SORT_COMPARATORS[sortBy])
  return direction === 'asc' ? sorted : sorted.reverse()
}

// team member grouping
export const TEAM_MEMBER_GROUP_BY_KEYS = ['payGrade'] as const

export type TeamMemberGroupByKey = (typeof TEAM_MEMBER_GROUP_BY_KEYS)[number]

export const TEAM_MEMBER_GROUP_BY_GETTERS: Record<
  TeamMemberGroupByKey,
  (tm: TeamMemberData) => string
> = {
  payGrade: tm => tm.payGrade?.name ?? '',
}

export function groupTeamMembers(
  tms: TeamMemberData[],
  groupBy: TeamMemberGroupByKey | undefined,
): TeamMemberData[][] {
  if (!groupBy)
    return [tms]
  const groups = new Map<string, TeamMemberData[]>()

  tms.forEach((tm) => {
    const key = TEAM_MEMBER_GROUP_BY_GETTERS[groupBy](tm)
    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key)!.push(tm)
  })

  return Array.from(groups.values())
}
