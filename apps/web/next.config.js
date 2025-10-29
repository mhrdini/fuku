/**
 * @type {import('next').NextConfig}
 */
module.exports = {
  transpilePackages: [
    '@fuku/ui',
    '@fuku/config-eslint',
    '@fuku/config-tailwind',
    '@fuku/config-typescript',
    '@fuku/database',
  ],
  reactStrictMode: true,
}
