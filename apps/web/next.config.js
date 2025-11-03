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
}
