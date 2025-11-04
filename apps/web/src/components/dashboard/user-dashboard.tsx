'use client'

import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@fuku/ui/components'
import { useSuspenseQuery } from '@tanstack/react-query'

import { useTRPC } from '~/trpc/client'

export default function UserDashboard() {
  const params = useParams()
  const username = params?.username as string
  const trpc = useTRPC()

  const { data: user } = useSuspenseQuery(
    trpc.user.getByUsername.queryOptions({ username }),
  )

  return (
    <Card>
      <CardHeader>
        <h2 className='text-lg font-medium'>Welcome back, {user?.name}!</h2>
      </CardHeader>
      <CardContent className='h-full'></CardContent>
    </Card>
  )
}
