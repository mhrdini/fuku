import { redirect } from 'next/navigation'

import { getSession } from '~/auth/server'

const IndexPage = async () => {
  const session = await getSession()

  if (session) {
    redirect(`/${session.user.username}`)
  }

  return (
    <div>
      <h1>Hello World</h1>
    </div>
  )
}

export default IndexPage
