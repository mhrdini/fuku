'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@fuku/ui/components'
import { LogOut } from 'lucide-react'

import { authClient } from '~/auth/client'

export function LogOutButton() {
  const router = useRouter()
  const handleLogOut = async () => {
    await authClient.signOut().then(() => {
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
