'use client'

import { useRouter } from 'next/navigation'

import { authClient } from '~/auth/client'

export function LogOutButton() {
  const router = useRouter()
  const handleLogOut = async () => {
    await authClient.signOut()
    router.refresh()
  }

  return (
    <button onClick={handleLogOut} className='btn btn-secondary'>
      Log Out
    </button>
  )
}
