'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@fuku/ui/components'
import { LogOut } from 'lucide-react'

import { authClient } from '~/auth/client'
import { useDashboardStore } from '~/store/dashboard'

export function LogOutButton() {
  const { reset } = useDashboardStore()
  const router = useRouter()
  const handleLogOut = async () => {
    await authClient.signOut().then(() => {
      reset()
      router.push('/')
    })
  }

  return (
    <Button onClick={handleLogOut} variant='outline' size='sm'>
      <LogOut />
      Log out
    </Button>
  )
}
