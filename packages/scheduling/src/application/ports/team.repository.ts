import { Assignment, Unavailability } from '../../domain/types'
import { TeamSnapshot } from '../../domain/types/engine'
import { Period } from '../../shared/utils/date'

export interface TeamRepository {
  getTeamSnapshot(
    teamId: string,
    period: Period,
    preloaded?: {
      assignments?: Assignment[]
      unavailabilities?: Unavailability[]
    },
  ): Promise<TeamSnapshot>
  persistSchedule(
    teamId: string,
    period: Period,
    assignments: Assignment[],
  ): Promise<void>
}
