type DashboardContentLayoutProps = {
  children: React.ReactNode
}

export function DashboardContentLayout({
  children,
}: DashboardContentLayoutProps) {
  return (
    <main className='dashboard breakpoint-container @container/main py-6'>
      <div className='space-y-4'>{children}</div>
    </main>
  )
}
