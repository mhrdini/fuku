type DashboardContentLayoutProps = {
  children: React.ReactNode
}

export const DashboardContentLayout = ({
  children,
}: DashboardContentLayoutProps) => {
  return (
    <main className='@container/main dashboard py-6 breakpoint-container'>
      <div className='space-y-4'>{children}</div>
    </main>
  )
}
