import { useTranslation } from '@fuku/i18n/react'
import { Button } from '@fuku/ui/components'
import { GlobeIcon } from 'lucide-react'

import type { Language } from '@fuku/i18n'

export function LanguageSelect() {
  const { t, i18n } = useTranslation()

  const toggleLanguage = async () => {
    const nextLanguage: Language
      = i18n.language === 'en' ? 'ja' : 'en'
    await i18n.changeLanguage(nextLanguage)
    // await i18next.changeLanguage(nextLanguage)
  }
  return (
    <Button
      type='button'
      size='icon-sm'
      variant='outline'
      onClick={toggleLanguage}
      aria-description={t('toggleTheme', 'Toggle theme')}
    >
      <GlobeIcon />
    </Button>
  )
}
