import { redirect } from 'next/navigation'
import { SidebarProvider } from '@fuku/ui/components'

import { getSession } from '~/auth/server'
import { DashboardHeader } from '~/components/dashboard/dashboard-header'
import { DashboardSidebar } from '~/components/dashboard/sidebar/dashboard-sidebar'
import { HydrateClient, prefetch, trpc } from '~/trpc/server'

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const session = await getSession()

  if (!session || session.user.username !== username) {
    redirect('/login')
  } else {
    prefetch(trpc.user.getByUsername.queryOptions({ username }))
    prefetch(trpc.team.getAllOwned.queryOptions())
  }

  return (
    <div className='min-h-screen w-full'>
      <HydrateClient>
        <SidebarProvider>
          <DashboardSidebar username={username} />
          <div className='flex flex-1 flex-col'>
            <DashboardHeader />
            <main className='x-auto size-full max-w-7xl flex-1 px-14 py-6'>
              <div className='space-y-4'>{children}</div>
            </main>
          </div>
        </SidebarProvider>
      </HydrateClient>
    </div>
  )
}
