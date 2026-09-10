'use client'

import i18n from '@fuku/i18n/client'
import { I18nextProvider } from '@fuku/i18n/react'
import { Toaster, TooltipProvider } from '@fuku/ui/components'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ThemeProvider } from 'next-themes'

import { TRPCReactProvider } from '~/trpc/client'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute='class' defaultTheme='system' enableSystem>
      <I18nextProvider i18n={i18n}>
        <TRPCReactProvider>
          <TooltipProvider>{children}</TooltipProvider>
          <ReactQueryDevtools initialIsOpen={false} />
          <Toaster />
        </TRPCReactProvider>
      </I18nextProvider>
    </ThemeProvider>
  )
}
