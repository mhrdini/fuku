import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'

vi.mock('zustand')
vi.mock('sonner')

vi.mock('@fuku/ui/components', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@fuku/ui/components')>()

  return {
    ...actual,
    Command: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    CommandEmpty: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    CommandGroup: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    CommandList: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    CommandItem: ({
      children,
      value,
      onSelect,
    }: {
      children: React.ReactNode
      value: string
      onSelect?: (value: string) => void
    }) => (
      <button
        type='button'
        onClick={() => onSelect?.(value)}
      >
        {children}
      </button>
    ),
  }
})

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  cleanup()
  localStorage.clear()
})
