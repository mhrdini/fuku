import '~/globals.css'

import { Geist, Noto_Sans_JP } from 'next/font/google'

import { Providers } from './providers'

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

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html
      suppressHydrationWarning
      className={`${geist.variable} ${notoSansJP.variable}  antialiased`}
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

export default RootLayout
