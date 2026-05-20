import '~/globals.css'

import { Geist, Noto_Sans_JP } from 'next/font/google'
import { Toaster } from '@fuku/ui/components'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ThemeProvider } from 'next-themes'

import { TRPCReactProvider } from '~/trpc/client'

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
  display: 'swap',
})

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  variable: '--font-noto',
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
      suppressHydrationWarning
      className={`${geist.variable} ${notoSansJP.variable}  antialiased`}
    >
      <body>
        <ThemeProvider attribute='class' defaultTheme='system' enableSystem>
          <TRPCReactProvider>
            {children}
            <ReactQueryDevtools initialIsOpen={false} />
            <Toaster />
          </TRPCReactProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

export default RootLayout
