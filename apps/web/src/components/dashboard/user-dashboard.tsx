'use client'

import { useParams } from 'next/navigation'
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
  return (
    <Card>
      <CardHeader>
        <h2 className='text-lg font-medium'>Welcome back, {user.name}!</h2>
      </CardHeader>
      <CardContent className='h-full'></CardContent>
    </Card>
  )
}
