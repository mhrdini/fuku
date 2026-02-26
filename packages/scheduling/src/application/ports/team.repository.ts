import { TeamSnapshot } from '../../domain/types/engine'
import { Period } from '../../shared/utils/date'

export interface TeamRepository {
  getTeamSnapshot(teamId: string, period: Period): Promise<TeamSnapshot>
}
