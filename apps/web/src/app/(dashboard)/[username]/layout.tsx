import { redirect } from 'next/navigation'
import { SidebarProvider } from '@fuku/ui/components'

import { getSession } from '~/auth/server'
import { DashboardContentLayout } from '~/components/dashboard/content-layout'
import { DashboardHeader } from '~/components/dashboard/header'
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
  }

  await prefetch(trpc.user.byUsername.queryOptions({ username }))
  await prefetch(trpc.user.getSidebarState.queryOptions())

  return (
    <div className='min-h-screen'>
      <HydrateClient>
        <SessionProvider session={session}>
          <SheetManager />
          <DialogManager />
          <SidebarProvider>
            <DashboardSidebar username={username} />
            <div className='flex flex-1 flex-col'>
              <DashboardHeader />
              <DashboardContentLayout>{children}</DashboardContentLayout>
            </div>
          </SidebarProvider>
        </SessionProvider>
      </HydrateClient>
    </div>
  )
}
