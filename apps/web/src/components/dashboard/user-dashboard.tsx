'use client'

import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@fuku/ui/components'
import { useQuery } from '@tanstack/react-query'

import { useTRPC } from '~/trpc/client'

export default function UserDashboard() {
  const params = useParams()
  const username = params?.username as string
  const trpc = useTRPC()

  const { data: user } = useQuery({
    ...trpc.user.byUsername.queryOptions({
      username: session?.user.username!,
    }),
  })

  return (
    <Card>
      <CardHeader>
        <h2 className='text-lg font-medium'>
          Welcome back{user ? `, ${user.name}` : ''}!
        </h2>
      </CardHeader>
      <CardContent className='h-full'></CardContent>
    </Card>
  )
}
