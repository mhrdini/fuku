import antfu from '@antfu/eslint-config'
import nextPlugin from '@next/eslint-plugin-next'

import { sharedRules } from './shared-rules.mjs'

/**
 * A custom ESLint configuration for libraries that use Next.js.
 * antfu has no built-in `nextjs` flag, so @next/eslint-plugin-next is
 * composed in by hand, same as your old setup.
 *
 * @type {import("eslint").Linter.Config[]}
 */
export default antfu(
  {
    type: 'app',
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
      '.next/**',
      '.pnpm-store/**',
      '**/migrations/*',
    ],
  },

  ...sharedRules,

  {
    plugins: { '@next/next': nextPlugin },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      '@next/next/no-html-link-for-pages': 'off',
    },
  },

  {
    rules: {
      'style/jsx-quotes': ['error', 'prefer-single'],
      'style/brace-style': ['error', '1tbs', { allowSingleLine: true }],

    },
  },
)
