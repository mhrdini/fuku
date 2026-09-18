import antfu from '@antfu/eslint-config'

import { sharedRules } from './shared-rules.mjs'

/**
 * A shared ESLint configuration for the repository, built on
 * @antfu/eslint-config. Formatting now comes from ESLint Stylistic instead
 * of Prettier — do not add eslint-config-prettier back.
 *
 * @type {import("eslint").Linter.Config[]}
 */
export default antfu(
  {
    type: 'lib',
    typescript: true,
    pnpm: true,

    stylistic: {
      indent: 2, // tabWidth: 2
      quotes: 'single', // singleQuote: true
      semi: false, // semi: false
    },

    // keep Prettier for css/html/markdown; JS/TS/JSX still go through
    // ESLint Stylistic above, this doesn't touch that
    formatters: true,

    ignores: [
      'dist/**',
      'node_modules/**',
      'generated/**',
      '.pnpm-store/**',
      '**/migrations/*',
    ],
  },

  ...sharedRules,

  // stylistic tweaks not covered by the `stylistic` shorthand above
  {
    rules: {
      'style/jsx-quotes': ['error', 'prefer-single'], // jsxSingleQuote: true
      'style/brace-style': ['error', '1tbs', { allowSingleLine: true }], // Prettier always collapses `} else {`
    },
  },
)
