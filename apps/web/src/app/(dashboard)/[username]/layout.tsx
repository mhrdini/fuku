import { SidebarProvider } from '@fuku/ui/components'

import { DashboardHeader } from '~/components/dashboard/dashboard-header'
import { DashboardSidebar } from '~/components/dashboard/dashboard-sidebar'
import { HydrateClient } from '~/trpc/server'

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  return (
    <div className='min-h-screen w-full'>
      <HydrateClient>
        <SidebarProvider>
          <DashboardSidebar username={username} />
          <div className='flex flex-1 flex-col'>
            <DashboardHeader />
            <main className='mx-auto size-full max-w-7xl flex-1 px-4 py-6 sm:px-6'>
              {children}
            </main>
          </div>
        </SidebarProvider>
      </HydrateClient>
    </div>
  )
}
