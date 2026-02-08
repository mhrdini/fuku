import { defineConfig, env } from 'prisma/config'

import 'dotenv/config'

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import dotenvExpand from 'dotenv-expand'

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
