
import { getSession } from '~/auth/server'
import { LogOutButton } from '~/components/auth/log-out-button'
import { Welcome } from '~/components/ui/welcome'
import { HydrateClient, prefetch, trpc } from '~/trpc/server'

const IndexPage = async () => {
  const session = await getSession()

  prefetch(trpc.user.byId.queryOptions({ id: session?.user.id ?? '' }))

  return (
    <div>
      <h1>Hello World</h1>
      {session ? (
        <>
          <HydrateClient>
            <Welcome userId={session.user.id} />
          </HydrateClient>
          <LogOutButton />
        </>
      ) : (
        <p>Please log in to continue.</p>
      )}
    </div>
  )
}

export default IndexPage
