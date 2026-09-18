import type { Assignment, Unavailability } from '../../domain/types'
import type { TeamSnapshot } from '../../domain/types/engine'
import type { Period } from '../../shared/utils/date'
import type { SchedulerAssignment } from '@fuku/domain/schemas'

export type TeamRepository = {
  getTeamSnapshot: (
    teamId: string,
    period: Period,
    preloaded?: {
      assignments?: Assignment[]
      unavailabilities?: Unavailability[]
    },
  ) => Promise<TeamSnapshot>
  persistSchedule: (
    teamId: string,
    period: Period,
    assignments: SchedulerAssignment[],
  ) => Promise<void>
}
