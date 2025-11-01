import { getSession } from '~/auth/server'
import { LogOutButton } from '~/components/auth/log-out-button'

const IndexPage = async () => {
  const session = await getSession()
  return (
    <div>
      <h1>Hello World</h1>
      {session ? (
        <>
          <p>Welcome back, user with ID: {session.user.id}</p>
          <LogOutButton />
        </>
      ) : (
        <p>Please log in to continue.</p>
      )}
    </div>
  )
}

export default IndexPage
