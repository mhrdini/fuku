'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@fuku/ui/components'

import { authClient } from '~/auth/client'

export function LogOutButton() {
  const router = useRouter()
  const handleLogOut = async () => {
    await authClient.signOut()
    router.refresh()
  }

  return (
    <Button onClick={handleLogOut} className='btn btn-secondary'>
      Log Out
    </Button>
  )
}
