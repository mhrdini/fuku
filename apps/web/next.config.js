const path = require('path')
/** @type {import('next').NextConfig} */
module.exports = {
  transpilePackages: [
    '@fuku/api',
    '@fuku/auth',
    '@fuku/db',
    '@fuku/ui',
    '@fuku/config-eslint',
    '@fuku/config-typescript',
  ],
  reactStrictMode: true,
  env: {
    CONTAINER_NAME: process.env.CONTAINER_NAME,
    POSTGRES_DB: process.env.POSTGRES_DB,
    POSTGRES_USER: process.env.POSTGRES_USER,
    POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD,
    POSTGRES_PORT: process.env.POSTGRES_PORT,
    DATABASE_URL: process.env.DATABASE_URL,
    PORT: process.env.PORT,
    BASE_URL: process.env.BASE_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    NEXT_PUBLIC_AUTH_URL: process.env.NEXT_PUBLIC_AUTH_URL,
  },
}
