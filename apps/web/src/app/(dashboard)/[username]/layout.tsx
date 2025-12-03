import { redirect } from 'next/navigation'
import { SidebarProvider } from '@fuku/ui/components'

import { getSession } from '~/auth/server'
import { DashboardContentLayout } from '~/components/dashboard/content-layout'
import { DashboardHeader } from '~/components/dashboard/header'
import { DashboardSidebar } from '~/components/dashboard/sidebar'
import { DialogManager } from '~/components/providers/dialog-manager'
import { SheetManager } from '~/components/providers/sheet-manager'
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
        <SheetManager />
        <DialogManager />
        <SidebarProvider>
          <DashboardSidebar username={username} />
          <div className='flex flex-1 flex-col'>
            <DashboardHeader />
            <DashboardContentLayout>{children}</DashboardContentLayout>
          </div>
        </SidebarProvider>
      </HydrateClient>
    </div>
  )
}
