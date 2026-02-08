import { Button } from '@fuku/ui/components'
import { SunMoon } from 'lucide-react'
import { useTheme } from 'next-themes'

export const ThemeToggle = () => {
  const { setTheme, resolvedTheme } = useTheme()

  const isDark = resolvedTheme === 'dark'

  return (
    <Button
      type='button'
      size='icon-sm'
      variant='outline'
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-description='Toggle theme'
    >
      <SunMoon />
    </Button>
  )
}
