import TeamOverviewContent from '~/components/dashboard/team/overview/content'
import { prefetch, trpc } from '~/trpc/server'

export default async function TeamPage() {
  prefetch(trpc.team.getAllOwned.queryOptions())

  return <TeamOverviewContent />
}
