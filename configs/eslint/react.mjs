import antfu from '@antfu/eslint-config'

import { sharedRules } from './shared-rules.mjs'

/**
 * A custom ESLint configuration for libraries that use React.
 * `react: true` pulls in eslint-plugin-react + eslint-plugin-react-hooks
 * and sets `settings.react.version: 'detect'` for you — no manual wiring
 * needed like before.
 *
 * @type {import("eslint").Linter.Config[]}
 */
export default antfu(
  {
    type: 'lib',
    pnpm: true,
    typescript: true,
    react: true,

    stylistic: {
      indent: 2,
      quotes: 'single',
      semi: false,
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

  {
    rules: {
      'style/jsx-quotes': ['error', 'prefer-single'],
      'style/brace-style': ['error', '1tbs', { allowSingleLine: true }],
    },
  },
)
