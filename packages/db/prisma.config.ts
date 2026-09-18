import dotenv from 'dotenv'
import 'dotenv/config'
import dotenvExpand from 'dotenv-expand'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, env } from 'prisma/config'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const result = dotenv.config({
  path: path.resolve(
    __dirname,
    `../../.env.${process.env.NODE_ENV ?? 'development'}`,
  ),
})

dotenvExpand.expand(result)

export default defineConfig({
  schema: 'prisma/',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
})
