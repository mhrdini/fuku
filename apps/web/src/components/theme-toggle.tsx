import { useTranslation } from '@fuku/i18n/react'
import { Button } from '@fuku/ui/components'
import { SunMoon } from 'lucide-react'
import { useTheme } from 'next-themes'

export function ThemeToggle() {
  const { t } = useTranslation()
  const { setTheme, resolvedTheme } = useTheme()

  const isDark = resolvedTheme === 'dark'

  return (
    <Button
      type='button'
      size='icon-sm'
      variant='outline'
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-description={t('toggleTheme', 'Toggle theme')}
    >
      <SunMoon />
    </Button>
  )
}
