type DashboardContentLayoutProps = {
  children: React.ReactNode
}

export const DashboardContentLayout = ({
  children,
}: DashboardContentLayoutProps) => {
  return (
    <main className='dashboard x-auto size-full max-w-7xl flex-1 px-10 sm:px-14 py-6'>
      <div className='space-y-4'>{children}</div>
    </main>
  )
}
