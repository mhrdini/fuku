import TeamDashboard from '~/components/dashboard/team/team-dashboard'
import { prefetch, trpc } from '~/trpc/server'

export default async function TeamPage() {
  prefetch(trpc.team.getAllOwned.queryOptions())

  return <TeamDashboard />
}
