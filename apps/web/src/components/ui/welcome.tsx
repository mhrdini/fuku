'use client'

import { useSuspenseQuery } from '@tanstack/react-query'

import { useTRPC } from '~/trpc/client'

interface WelcomeProps {
  userId: string
}

export const Welcome = ({ userId }: WelcomeProps) => {
  const trpc = useTRPC()
  const { data: user } = useSuspenseQuery(
    trpc.user.byId.queryOptions({ id: userId }),
  )

  return <div>Welcome, {user.name}!</div>
}
