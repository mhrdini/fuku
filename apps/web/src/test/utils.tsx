import type { ReactElement, ReactNode } from 'react'

import i18n from '@fuku/i18n/client'
import { I18nextProvider } from '@fuku/i18n/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {

  render as rtlRender,
} from '@testing-library/react'

import type { RenderOptions } from '@testing-library/react'

function TestProviders({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </I18nextProvider>
  )
}

function render(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  return rtlRender(ui, {
    wrapper: TestProviders,
    ...options,
  })
}

export { render }
