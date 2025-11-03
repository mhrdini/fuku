import '~/globals.css'

import { Geist, M_PLUS_1 } from 'next/font/google'

import { TRPCReactProvider } from '~/trpc/client'

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
  display: 'swap',
})

const mPlus = M_PLUS_1({
  subsets: ['latin'],
  variable: '--font-mplus',
  display: 'swap',
})

export const metadata = {
  title: 'fuku',
}

const RootLayout = ({
  children,
  params: { locale },
}: {
  children: React.ReactNode
  params: { locale: string }
}) => {
  return (
    <html
      lang={locale}
      className={`${geist.variable} ${mPlus.variable}  antialiased`}
    >
      <body className='font-sans'>
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  )
}

export default RootLayout
