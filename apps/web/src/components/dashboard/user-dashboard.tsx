'use client'

import { Card, CardContent, CardHeader } from '@fuku/ui/components'
import { useQuery } from '@tanstack/react-query'

import { useTRPC } from '~/trpc/client'
import { useSession } from '../providers/session-provider'

export default function UserDashboard() {
  const session = useSession()
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
