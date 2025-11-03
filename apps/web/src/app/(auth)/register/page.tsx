import { Suspense } from 'react'
import { redirect } from 'next/navigation'

import { getSession } from '~/auth/server'
import { UserAuthForm } from '~/components/auth/user-auth-form'

export default async function RegisterPage() {
  const session = await getSession()

  if (session) {
    redirect(`/${session.user.username}`)
  }

  return (
    <Suspense>
      <UserAuthForm register />
    </Suspense>
  )
}
