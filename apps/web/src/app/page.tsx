import { getSession } from '~/auth/server'

const IndexPage = async () => {
  const session = await getSession()
  return (
    <div>
      <h1>Hello World</h1>
      {session ? (
        <p>Welcome back, user with ID: {session.user.id}</p>
      ) : (
        <p>Please log in to continue.</p>
      )}
    </div>
  )
}

export default IndexPage
