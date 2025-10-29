import { prisma } from '@fuku/database'

const IndexPage = async () => {
  const users = await prisma.user.findMany()

  return (
    <div>
      <h1>Hello World</h1>
      <pre>{JSON.stringify(users, null, 2)}</pre>
    </div>
  )
}

export default IndexPage
