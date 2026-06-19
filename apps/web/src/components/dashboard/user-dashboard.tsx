'use client'

import { useTranslation } from '@fuku/i18n/react'
import { Card, CardContent, CardHeader } from '@fuku/ui/components'

interface UserDashboardProps {
  user: {
    name: string
    image: string | null
    id: string
    createdAt: Date
    updatedAt: Date
    email: string
    emailVerified: boolean
    username: string
    displayUsername: string
    lastActiveTeamId: string | null
  }
}

export default function UserDashboard({ user }: UserDashboardProps) {
  const { t } = useTranslation()
  return (
    <Card>
      <CardHeader>
        <h2 className='text-lg font-medium'>
          {t('welcomeBackName', 'Welcome back, {{name}}!', { name: user.name })}
        </h2>
      </CardHeader>
      <CardContent className='h-full'></CardContent>
    </Card>
  )
}
