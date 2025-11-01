import '@fuku/ui/styles.css'
import '~/globals.css'

import { TRPCReactProvider } from '~/trpc/client'

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang='en'>
      <body>
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  )
}

export default RootLayout
