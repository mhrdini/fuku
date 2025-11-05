'use client'

import type { ColumnDef } from '@tanstack/react-table'
import {
  PayGradeModelSchema,
  TeamMemberModelSchema,
  UserModelSchema,
} from '@fuku/db/schemas'
import { useQuery } from '@tanstack/react-query'
import z from 'zod/v4'

import { DataTable } from '~/components/ui/data-table'
import { zodToColumns } from '~/lib/column'
import { useDashboardStore } from '~/store/dashboard'
import { useTRPC } from '~/trpc/client'
import { ContentSkeleton } from '../../content-skeleton'

const UserSchema = UserModelSchema.pick({
  id: true,
  name: true,
  username: true,
}).nullable()

const PayGradeSchema = PayGradeModelSchema.pick({
  id: true,
  name: true,
  baseRate: true,
}).nullable()

const TeamMemberSchema = TeamMemberModelSchema.omit({
  payGrade: true,
  user: true,
  dayAssignments: true,
  unavailabilities: true,
  team: true,
}).extend({
  payGrade: PayGradeSchema,
  user: UserSchema,
})

const TeamMemberColumnSchema = z
  .object({
    name: z.string(),
    effectiveRate: z.number().nullable(),
    color: z.string().nullable(),
    username: z.string().nullable(),
  })
  .strict()

type TeamMemberColumnType = z.infer<typeof TeamMemberColumnSchema>

const columns: ColumnDef<TeamMemberColumnType>[] = zodToColumns(
  TeamMemberColumnSchema,
)

export default function TeamMembersContent() {
  const trpc = useTRPC()
  const { currentTeamSlug } = useDashboardStore()

  const { data: members, isPending } = useQuery({
    ...trpc.team.getTeamMembersBySlug.queryOptions({
      slug: currentTeamSlug!,
    }),
    enabled: !!currentTeamSlug,
  })

  function mapTeamMember(
    teamMember: z.infer<typeof TeamMemberSchema>,
    payGrade: z.infer<typeof PayGradeSchema>,
    user: z.infer<typeof UserSchema> | null,
  ): TeamMemberColumnType {
    return {
      name: `${teamMember.givenNames} ${teamMember.familyName}`,
      effectiveRate: payGrade
        ? payGrade.baseRate * teamMember.rateMultiplier
        : null,
      color: teamMember.color,
      username: user?.username ?? null,
    }
  }

  const teamMembersTableSection = (
    <DataTable
      columns={columns}
      data={
        members ? members.map(m => mapTeamMember(m, m.payGrade, m.user)) : []
      }
    />
  )

  return isPending ? (
    <ContentSkeleton />
  ) : (
    <>
      <h1 className='text-xl font-semibold'>Team Members</h1>
      {teamMembersTableSection}
    </>
  )
}
