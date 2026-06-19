'use client'

import { useRouter } from 'next/navigation'
import { useTranslation } from '@fuku/i18n/react'
import { Button } from '@fuku/ui/components'
import { LogOut } from 'lucide-react'

import { authClient } from '~/auth/client'

export function LogOutButton() {
  const { t } = useTranslation()
  const router = useRouter()
  const handleLogOut = async () => {
    await authClient.signOut().then(() => {
      router.push('/')
    })
  }

  return (
    <Button onClick={handleLogOut} variant='outline' size='sm'>
      <LogOut />
      {t('logOut', 'Log out')}
    </Button>
  )
}
