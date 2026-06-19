import i18next from '@fuku/i18n/client'
import { useTranslation } from '@fuku/i18n/react'
import { Button } from '@fuku/ui/components'
import { Globe } from 'lucide-react'

export const LanguageSelect = () => {
  const { t } = useTranslation()
  const toggleLanguage = async () => {
    await i18next.changeLanguage(i18next.language === 'en' ? 'ja' : 'en')
  }
  return (
    <Button
      type='button'
      size='icon-sm'
      variant='outline'
      onClick={toggleLanguage}
      aria-description={t('toggleTheme', 'Toggle theme')}
    >
      <Globe />
    </Button>
  )
}
