/**
 * @typedef {import("prettier").Config} PrettierConfig
 * @typedef {import("prettier-plugin-tailwindcss").PluginOptions} TailwindConfig
 * @typedef {import("@ianvs/prettier-plugin-sort-imports").PluginConfig} SortImportsConfig
 * @type {PrettierConfig | TailwindConfig | SortImportsConfig}
 */

const config = {
  plugins: [
    'prettier-plugin-tailwindcss',
    '@ianvs/prettier-plugin-sort-imports',
  ],
  tailwindAttributes: ['className'],
  tailwindFunctions: ['cn', 'cva'],
  importOrder: [
    '<TYPES>',
    '^(react/(.*)$)|^(react$)|^(react-native(.*)$)',
    '^(next/(.*)$)|^(next$)',
    '^(expo(.*)$)|^(expo$)',
    '<THIRD_PARTY_MODULES>',
    '',
    '<TYPES>^@mj',
    '^@mj/(.*)$',
    '',
    '<TYPES>^[.|..|~]',
    '^~/',
    '^[../]',
    '^[./]',
  ],
  importOrderParserPlugins: ['typescript', 'jsx', 'decorators-legacy'],
  importOrderTypeScriptVersion: '4.4.0',

  tabWidth: 2,
  semi: false,
  trailingComma: 'all',
  printWidth: 80,
  arrowParens: 'avoid',
  singleQuote: true,
  endOfLine: 'auto',
  jsxSingleQuote: true,
}

export default config
